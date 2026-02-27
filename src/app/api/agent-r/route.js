// /api/agent-r - Agent R Chat API
// Dummy-App: Returns mock response
// Production: Streams from Claude API

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages?.[messages.length - 1]?.content || '';

    // Dummy response
    return NextResponse.json({
      role: 'assistant',
      content: `[Dummy-App] Agent R ist im Produktionsmodus nicht verfügbar. Dein Input: "${lastMessage}". Im Live-System würde hier Claude mit Dashboard-Kontext, Tool-Calls und Streaming antworten.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Agent R failed', details: error.message },
      { status: 500 }
    );
  }
}
