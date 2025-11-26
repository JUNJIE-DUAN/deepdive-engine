import { NextRequest, NextResponse } from 'next/server';

// Use the main backend API URL (NestJS), not separate AI service
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, model = 'gemini', stream = true } = body;

    // Forward request to NestJS backend simple-chat endpoint
    const response = await fetch(`${API_URL}/api/v1/ai/simple-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        model,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    // If streaming, pass through the stream
    if (stream && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Otherwise return JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI service' },
      { status: 500 }
    );
  }
}
