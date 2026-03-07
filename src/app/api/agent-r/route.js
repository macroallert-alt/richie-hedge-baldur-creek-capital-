// src/app/api/agent-r/route.js
// Agent R API Route — Edge Runtime, Tool-Use-Loop, SSE Streaming
// Based on: AGENT_R_TECH_SPEC_TEIL_2.md §2.3-2.5

import { buildSystemPrompt } from '@/lib/agent-r-prompt';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/agent-r-tools';

export const runtime = 'edge';

// Max tool-use rounds before forcing final answer (Spec §2.4.1)
const MAX_TOOL_ROUNDS = 5;

// Max messages sent to Claude (keep context manageable)
const MAX_HISTORY_MESSAGES = 20;

// Claude model (Spec §2.2)
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const CLAUDE_MAX_TOKENS = 4096;

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

  // Build system prompt (Schicht 1 + Schicht 2 from dashboard)
  const systemPrompt = buildSystemPrompt(dashboard);

  // Trim history to MAX_HISTORY_MESSAGES (keep recent, drop old)
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
        // Tool-Use-Loop: non-streaming rounds for tool calls,
        // then final streaming round for the answer
        let currentMessages = [...claudeMessages];
        let toolRound = 0;

        while (toolRound < MAX_TOOL_ROUNDS) {
          // Call Claude (non-streaming for tool rounds)
          const response = await callClaude(apiKey, systemPrompt, currentMessages, TOOL_DEFINITIONS, false);

          if (!response.ok) {
            const errText = await response.text();
            send({ type: 'error', error: `Claude API Error: ${response.status} — ${errText}` });
            send({ type: 'done' });
            controller.close();
            return;
          }

          const result = await response.json();

          // Check for tool_use blocks
          const toolUseBlocks = (result.content || []).filter(b => b.type === 'tool_use');

          if (toolUseBlocks.length === 0) {
            // No tool calls — this is the final answer
            // Extract text and send as streamed chunks
            const textBlocks = (result.content || []).filter(b => b.type === 'text');
            const fullText = textBlocks.map(b => b.text).join('');

            // Send in chunks to simulate streaming feel
            const chunkSize = 20; // characters per chunk
            for (let i = 0; i < fullText.length; i += chunkSize) {
              send({ type: 'text_delta', text: fullText.slice(i, i + chunkSize) });
            }
            send({ type: 'done' });
            controller.close();
            return;
          }

          // Tool calls found — execute them in parallel
          // Send tool-call indicators to frontend
          for (const block of toolUseBlocks) {
            send({
              type: 'tool_call',
              tool: { name: block.name, input: block.input },
            });
          }

          // Execute all tools in parallel (Spec §2.4.2)
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (block) => {
              try {
                const result = await executeTool(block.name, block.input, dashboard);
                return {
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
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

          // Append assistant response + tool results to messages
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

        // Max tool rounds reached — force final answer without tools
        const finalResponse = await callClaude(apiKey, systemPrompt, currentMessages, [], true);

        if (!finalResponse.ok) {
          const errText = await finalResponse.text();
          send({ type: 'error', error: `Claude API Error: ${finalResponse.status}` });
          send({ type: 'done' });
          controller.close();
          return;
        }

        // Stream the final response
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


// ===== CLAUDE API CALL =====

async function callClaude(apiKey, systemPrompt, messages, tools, stream) {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: systemPrompt,
    messages,
    stream,
  };

  // Only include tools if we have them
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
// Parses SSE from Claude's streaming API and forwards text deltas

async function streamClaudeResponse(response, send) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

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
