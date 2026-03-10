// src/app/api/agent-r/route.js
// Agent R API Route â€” Edge Runtime, Tool-Use-Loop, SSE Streaming
// V1.1: Dashboard compression + rate limit handling
// Based on: AGENT_R_TECH_SPEC_TEIL_2.md Â§2.3-2.5

import { buildSystemPrompt } from '@/lib/agent-r-prompt';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/agent-r-tools';

export const runtime = 'edge';

// Max tool-use rounds before forcing final answer (Spec Â§2.4.1)
const MAX_TOOL_ROUNDS = 3; // Reduced from 5 to stay within rate limits

// Max messages sent to Claude (keep context manageable)
const MAX_HISTORY_MESSAGES = 10; // Reduced from 20 for token budget

// Claude model (Spec Â§2.2)
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_MAX_TOKENS = 8192;

// Rate limit retry
const RATE_LIMIT_WAIT_MS = 5000; // 5 seconds
const MAX_RETRIES = 2;


// ===== DASHBOARD COMPRESSION =====
// Full dashboard.json is ~37KB (~10K tokens) â€” too much for 30K/min rate limit
// Compress to ~3-5KB (~1-2K tokens) with only what Agent R needs in System Prompt
// Full dashboard stays available via get_dashboard tool

function compressDashboard(dashboard) {
  if (!dashboard) return null;

  return {
    // Timing
    date: dashboard.date,
    generated_at: dashboard.generated_at,
    weekday: dashboard.weekday,

    // Header (compact)
    header: {
      briefing_type: dashboard.header?.briefing_type,
      system_conviction: dashboard.header?.system_conviction,
      risk_ampel: dashboard.header?.risk_ampel,
      v16_regime: dashboard.header?.v16_regime,
      data_quality: dashboard.header?.data_quality,
    },

    // V16 essentials
    v16: {
      regime: dashboard.v16?.regime,
      current_drawdown: dashboard.v16?.current_drawdown,
      regime_confidence: dashboard.v16?.regime_confidence,
      dd_protect_status: dashboard.v16?.dd_protect_status,
      current_weights: dashboard.v16?.current_weights,
      top_5_weights: dashboard.v16?.top_5_weights,
    },

    // Risk essentials
    risk: {
      portfolio_status: dashboard.risk?.portfolio_status,
      emergency_triggers: dashboard.risk?.emergency_triggers,
      alerts: dashboard.risk?.alerts,
    },

    // Layers (scores only)
    layers: {
      fragility_state: dashboard.layers?.fragility_state,
      layer_scores: dashboard.layers?.layer_scores,
    },

    // Execution (compact)
    execution: {
      execution_level: dashboard.execution?.execution_level,
      total_score: dashboard.execution?.total_score,
      max_score: dashboard.execution?.max_score,
      veto_applied: dashboard.execution?.veto_applied,
      confirming_count: dashboard.execution?.confirming_count,
      conflicting_count: dashboard.execution?.conflicting_count,
      net_assessment: dashboard.execution?.net_assessment,
      recommendation_action: dashboard.execution?.recommendation_action,
      recommendation_short: dashboard.execution?.recommendation_short,
    },

    // Agent R context (already compact)
    agent_r_context: dashboard.agent_r_context,
    agent_r_queue: dashboard.agent_r_queue,

    // Digest (1-liners)
    digest: dashboard.digest,

    // Action items (summary only)
    action_items: {
      summary: dashboard.action_items?.summary,
      prominent: dashboard.action_items?.prominent,
    },

    // F6 (status only)
    f6: { status: dashboard.f6?.status },

    // G7 (compact)
    g7_summary: {
      active_regime: dashboard.g7_summary?.active_regime,
      regime_label: dashboard.g7_summary?.regime_label,
      ewi_score: dashboard.g7_summary?.ewi_score,
    },

    // Intelligence (compact)
    intelligence: {
      status: dashboard.intelligence?.status,
      consensus: dashboard.intelligence?.consensus,
      divergences_count: dashboard.intelligence?.divergences_count,
    },
  };
}


// ===== COMPACT TOOL RESULTS =====
// Truncate large tool results to stay within token budget

function compactToolResult(result) {
  const str = JSON.stringify(result);
  // If under 3KB, keep as-is
  if (str.length < 3000) return str;
  // Truncate with note
  return str.slice(0, 3000) + '\n... [truncated â€” use get_dashboard for full data]';
}


export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages = [], dashboard = null } = body;

  if (!messages.length) {
    return new Response(
      JSON.stringify({ error: 'Keine Messages' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Compress dashboard for System Prompt (full dashboard stays for tool execution)
  const compressedDashboard = compressDashboard(dashboard);

  // Build system prompt with COMPRESSED dashboard
  const systemPrompt = buildSystemPrompt(compressedDashboard);

  // Trim history to MAX_HISTORY_MESSAGES
  // Convert from frontend format { role, text } to Claude format { role, content }
  const claudeMessages = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(msg => ({
      role: msg.role,
      content: msg.text || msg.content || '',
    }));

  // SSE Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let currentMessages = [...claudeMessages];
        let toolRound = 0;

        while (toolRound < MAX_TOOL_ROUNDS) {
          // Call Claude with retry on rate limit
          const response = await callClaudeWithRetry(apiKey, systemPrompt, currentMessages, TOOL_DEFINITIONS, false);

          if (!response.ok) {
            const errText = await response.text();
            send({ type: 'error', error: `Claude API Error: ${response.status} â€” ${errText}` });
            send({ type: 'done' });
            controller.close();
            return;
          }

          const result = await response.json();

          // Check for tool_use blocks
          const toolUseBlocks = (result.content || []).filter(b => b.type === 'tool_use');

          if (toolUseBlocks.length === 0) {
            // No tool calls â€” final answer
            const textBlocks = (result.content || []).filter(b => b.type === 'text');
            const fullText = textBlocks.map(b => b.text).join('');

            // Send in chunks to simulate streaming
            const chunkSize = 20;
            for (let i = 0; i < fullText.length; i += chunkSize) {
              send({ type: 'text_delta', text: fullText.slice(i, i + chunkSize) });
            }
            send({ type: 'done' });
            controller.close();
            return;
          }

          // Tool calls â€” execute in parallel
          for (const block of toolUseBlocks) {
            send({
              type: 'tool_call',
              tool: { name: block.name, input: block.input },
            });
          }

          // Execute tools â€” pass FULL dashboard for tool execution
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (block) => {
              try {
                const result = await executeTool(block.name, block.input, dashboard);
                return {
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: compactToolResult(result),
                };
              } catch (error) {
                return {
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify({ error: error.message }),
                  is_error: true,
                };
              }
            })
          );

          // Append to messages
          currentMessages.push({
            role: 'assistant',
            content: result.content,
          });
          currentMessages.push({
            role: 'user',
            content: toolResults,
          });

          toolRound++;
        }

        // Max tool rounds reached â€” force final answer
        const finalResponse = await callClaudeWithRetry(apiKey, systemPrompt, currentMessages, [], true);

        if (!finalResponse.ok) {
          const errText = await finalResponse.text();
          send({ type: 'error', error: `Claude API Error: ${finalResponse.status}` });
          send({ type: 'done' });
          controller.close();
          return;
        }

        await streamClaudeResponse(finalResponse, send);
        send({ type: 'done' });
        controller.close();

      } catch (error) {
        send({ type: 'error', error: error.message || 'Unbekannter Fehler' });
        send({ type: 'done' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


// ===== CLAUDE API CALL WITH RETRY =====

async function callClaudeWithRetry(apiKey, systemPrompt, messages, tools, stream) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await callClaude(apiKey, systemPrompt, messages, tools, stream);

    if (response.status === 429 && attempt < MAX_RETRIES) {
      // Rate limited â€” wait and retry
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WAIT_MS * (attempt + 1)));
      continue;
    }

    return response;
  }
}

async function callClaude(apiKey, systemPrompt, messages, tools, stream) {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: systemPrompt,
    messages,
    stream,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
}


// ===== STREAM CLAUDE RESPONSE =====

async function streamClaudeResponse(response, send) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          send({ type: 'text_delta', text: parsed.delta.text });
        }

        if (parsed.type === 'message_stop') {
          return;
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }
}

