import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, max_length = 200, language = 'zh' } = body;

    // Forward request to AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/ai/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        max_length,
        language,
      }),
    });

    if (!response.ok) {
      // Try to get error details from the response
      let errorDetail = `AI service responded with status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail =
          errorData.detail ||
          errorData.error ||
          errorData.message ||
          errorDetail;
      } catch {
        // If we can't parse JSON, use the status text
        errorDetail = response.statusText || errorDetail;
      }
      console.error('AI summary error:', errorDetail);
      return NextResponse.json(
        { error: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI summary error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `无法连接到AI服务: ${errorMessage}` },
      { status: 500 }
    );
  }
}
