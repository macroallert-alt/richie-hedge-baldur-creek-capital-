// src/app/api/agent-r/route.js
// Agent R API Route — Edge Runtime, Tool-Use-Loop, SSE Streaming
// V1.7: Debug — sends status SSE events at each step to diagnose Mobile hang
// Based on: AGENT_R_TECH_SPEC_TEIL_2.md §2.3-2.5

import { buildSystemPrompt } from '@/lib/agent-r-prompt';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/agent-r-tools';

export const runtime = 'edge';

const MAX_TOOL_ROUNDS = 2;
const MAX_HISTORY_MESSAGES = 10;
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_MAX_TOKENS = 8192;
const RATE_LIMIT_WAIT_MS = 5000;
const MAX_RETRIES = 2;
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

function compactToolResult(result) {
  const str = JSON.stringify(result);
  if (str.length < 3000) return str;
  return str.slice(0, 3000) + '\n... [truncated]';
}

function startPing(send) {
  const id = setInterval(() => {
    try { send({ type: 'ping' }); } catch {}
  }, PING_INTERVAL_MS);
  return () => clearInterval(id);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendTextChunked(fullText, send, stopPing) {
  const chunkSize = 80;
  let pingsStopped = false;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    if (!pingsStopped) { stopPing(); pingsStopped = true; }
    send({ type: 'text_delta', text: fullText.slice(i, i + chunkSize) });
    if ((i / chunkSize) % 5 === 4) await delay(1);
  }
  if (!pingsStopped) stopPing();
  await delay(50);
}


export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { messages = [], dashboard = null } = body;
  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'Keine Messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const compressedDashboard = compressDashboard(dashboard);
  const systemPrompt = buildSystemPrompt(compressedDashboard);

  const claudeMessages = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(msg => ({ role: msg.role, content: msg.text || msg.content || '' }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      const stopPing = startPing(send);

      try {
        let currentMessages = [...claudeMessages];

        for (let toolRound = 0; toolRound <= MAX_TOOL_ROUNDS; toolRound++) {
          const useTools = toolRound < MAX_TOOL_ROUNDS;

          // DEBUG: status before Claude call
          send({ type: 'text_delta', text: '' });

          const response = await callClaudeWithRetry(
            apiKey, systemPrompt, currentMessages,
            useTools ? TOOL_DEFINITIONS : [],
            false
          );

          if (!response.ok) {
            const errText = await response.text();
            stopPing();
            send({ type: 'error', error: `Claude API Error: ${response.status} — ${errText}` });
            send({ type: 'done' });
            controller.close();
            return;
          }

          let result;
          try {
            result = await response.json();
          } catch (parseErr) {
            stopPing();
            send({ type: 'error', error: `JSON parse error: ${parseErr.message}` });
            send({ type: 'done' });
            controller.close();
            return;
          }

          const toolUseBlocks = (result.content || []).filter(b => b.type === 'tool_use');

          if (toolUseBlocks.length === 0) {
            const textBlocks = (result.content || []).filter(b => b.type === 'text');
            const fullText = textBlocks.map(b => b.text).join('');
            await sendTextChunked(fullText, send, stopPing);
            send({ type: 'done' });
            controller.close();
            return;
          }

          // Notify client about tool calls
          for (const block of toolUseBlocks) {
            send({ type: 'tool_call', tool: { name: block.name, input: block.input } });
          }

          // Execute tools ONE BY ONE (not parallel) to avoid Edge CPU limits
          const toolResults = [];
          for (const block of toolUseBlocks) {
            try {
              const toolResult = await executeTool(block.name, block.input, dashboard);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: compactToolResult(toolResult),
              });
            } catch (error) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({ error: error.message }),
                is_error: true,
              });
            }
          }

          currentMessages.push({ role: 'assistant', content: result.content });
          currentMessages.push({ role: 'user', content: toolResults });
        }

        stopPing();
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
  if (tools && tools.length > 0) body.tools = tools;

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
