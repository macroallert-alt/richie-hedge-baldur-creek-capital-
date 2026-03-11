// src/app/api/agent-r/route.js
// Agent R API Route — Edge Runtime, Tool-Use-Loop, SSE Streaming
// V1.4: Mobile fix — pings stay alive until first text arrives, async yields between chunks
// Based on: AGENT_R_TECH_SPEC_TEIL_2.md §2.3-2.5

import { buildSystemPrompt } from '@/lib/agent-r-prompt';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/agent-r-tools';

export const runtime = 'edge';

// Max tool-use rounds before forcing final answer (Spec §2.4.1)
const MAX_TOOL_ROUNDS = 3;

// Max messages sent to Claude (keep context manageable)
const MAX_HISTORY_MESSAGES = 10;

// Claude model (Spec §2.2)
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_MAX_TOKENS = 8192;

// Rate limit retry
const RATE_LIMIT_WAIT_MS = 5000;
const MAX_RETRIES = 2;

// Keepalive ping interval (ms) — keeps Mobile Safari/Chrome from dropping SSE
const PING_INTERVAL_MS = 2500;


// ===== DASHBOARD COMPRESSION =====

function compressDashboard(dashboard) {
  if (!dashboard) return null;

  return {
    date: dashboard.date,
    generated_at: dashboard.generated_at,
    weekday: dashboard.weekday,

    header: {
      briefing_type: dashboard.header?.briefing_type,
      system_conviction: dashboard.header?.system_conviction,
      risk_ampel: dashboard.header?.risk_ampel,
      v16_regime: dashboard.header?.v16_regime,
      data_quality: dashboard.header?.data_quality,
    },

    v16: {
      regime: dashboard.v16?.regime,
      current_drawdown: dashboard.v16?.current_drawdown,
      regime_confidence: dashboard.v16?.regime_confidence,
      dd_protect_status: dashboard.v16?.dd_protect_status,
      current_weights: dashboard.v16?.current_weights,
      top_5_weights: dashboard.v16?.top_5_weights,
    },

    risk: {
      portfolio_status: dashboard.risk?.portfolio_status,
      emergency_triggers: dashboard.risk?.emergency_triggers,
      alerts: dashboard.risk?.alerts,
    },

    layers: {
      fragility_state: dashboard.layers?.fragility_state,
      layer_scores: dashboard.layers?.layer_scores,
    },

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

    agent_r_context: dashboard.agent_r_context,
    agent_r_queue: dashboard.agent_r_queue,

    digest: dashboard.digest,

    action_items: {
      summary: dashboard.action_items?.summary,
      prominent: dashboard.action_items?.prominent,
    },

    f6: { status: dashboard.f6?.status },

    g7_summary: {
      active_regime: dashboard.g7_summary?.active_regime,
      regime_label: dashboard.g7_summary?.regime_label,
      ewi_score: dashboard.g7_summary?.ewi_score,
    },

    intelligence: {
      status: dashboard.intelligence?.status,
      consensus: dashboard.intelligence?.consensus,
      divergences_count: dashboard.intelligence?.divergences_count,
    },
  };
}


// ===== COMPACT TOOL RESULTS =====

function compactToolResult(result) {
  const str = JSON.stringify(result);
  if (str.length < 3000) return str;
  return str.slice(0, 3000) + '\n... [truncated — use get_dashboard for full data]';
}


// ===== KEEPALIVE PING HELPER =====

function startPing(send) {
  const id = setInterval(() => {
    try {
      send({ type: 'ping' });
    } catch {
      // Stream already closed
    }
  }, PING_INTERVAL_MS);
  return () => clearInterval(id);
}

// ===== ASYNC DELAY =====
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// ===== SEND TEXT WITH MOBILE-SAFE CHUNKING =====
// Sends fullText in chunks with periodic async yields so Mobile browsers
// can flush their SSE buffer. Pings are stopped only AFTER first chunk sent.

async function sendTextChunked(fullText, send, stopPing) {
  const chunkSize = 80;
  let pingsStopped = false;

  for (let i = 0; i < fullText.length; i += chunkSize) {
    // Stop pings after sending the first real text chunk
    // (keeps connection alive until content actually flows)
    if (!pingsStopped) {
      stopPing();
      pingsStopped = true;
    }

    send({ type: 'text_delta', text: fullText.slice(i, i + chunkSize) });

    // Yield to event loop every 5 chunks — lets Mobile browsers
    // flush their SSE buffer and fire read() callbacks
    if ((i / chunkSize) % 5 === 4) {
      await delay(1);
    }
  }

  // If text was empty, still stop pings
  if (!pingsStopped) {
    stopPing();
  }

  // Ensure final chunks are flushed before caller sends 'done'
  await delay(50);
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

  const compressedDashboard = compressDashboard(dashboard);
  const systemPrompt = buildSystemPrompt(compressedDashboard);

  const claudeMessages = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(msg => ({
      role: msg.role,
      content: msg.text || msg.content || '',
    }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller already closed
        }
      };

      // Start keepalive pings immediately — critical for Mobile
      const stopPing = startPing(send);

      try {
        let currentMessages = [...claudeMessages];
        let toolRound = 0;

        while (toolRound < MAX_TOOL_ROUNDS) {
          // Pings continue automatically during Claude API wait
          const response = await callClaudeWithRetry(apiKey, systemPrompt, currentMessages, TOOL_DEFINITIONS, false);

          if (!response.ok) {
            const errText = await response.text();
            stopPing();
            send({ type: 'error', error: `Claude API Error: ${response.status} — ${errText}` });
            send({ type: 'done' });
            controller.close();
            return;
          }

          const result = await response.json();

          const toolUseBlocks = (result.content || []).filter(b => b.type === 'tool_use');

          if (toolUseBlocks.length === 0) {
            // No tool calls — this is the final answer
            const textBlocks = (result.content || []).filter(b => b.type === 'text');
            const fullText = textBlocks.map(b => b.text).join('');

            // Send text with mobile-safe chunking (stops pings internally)
            await sendTextChunked(fullText, send, stopPing);
            send({ type: 'done' });
            controller.close();
            return;
          }

          // Tool calls — notify client
          for (const block of toolUseBlocks) {
            send({
              type: 'tool_call',
              tool: { name: block.name, input: block.input },
            });
          }

          // Execute tools — pings continue during this
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

        // Max tool rounds reached — force final answer (streamed)
        // Pings keep running during the Claude API call
        const finalResponse = await callClaudeWithRetry(apiKey, systemPrompt, currentMessages, [], true);

        if (!finalResponse.ok) {
          stopPing();
          const errText = await finalResponse.text();
          send({ type: 'error', error: `Claude API Error: ${finalResponse.status}` });
          send({ type: 'done' });
          controller.close();
          return;
        }

        // Stream Claude response — pings stop after first text arrives
        await streamClaudeResponse(finalResponse, send, stopPing);
        await delay(50);
        send({ type: 'done' });
        controller.close();

      } catch (error) {
        stopPing();
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


// ===== STREAM CLAUDE RESPONSE (Mobile-Safe) =====
// Pings stay alive until the first text_delta arrives from Claude's stream.
// This prevents Mobile Safari from killing the connection during the
// gap between the last ping and Claude's first streamed token.

async function streamClaudeResponse(response, send, stopPing) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let pingsStopped = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        if (!pingsStopped) stopPing();
        return;
      }

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          // Stop pings on first real content
          if (!pingsStopped) {
            stopPing();
            pingsStopped = true;
          }
          send({ type: 'text_delta', text: parsed.delta.text });
        }

        if (parsed.type === 'message_stop') {
          if (!pingsStopped) stopPing();
          return;
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  // Stream ended without explicit stop — clean up pings
  if (!pingsStopped) stopPing();
}
