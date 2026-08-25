import { NextRequest, NextResponse } from 'next/server';
import { processQuery } from '@/lib/agent/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.length > 2_000) {
      return NextResponse.json({ error: 'Query must be 2,000 characters or less' }, { status: 400 });
    }

    const response = await processQuery(query);

    return NextResponse.json(response, { status: response.success ? 200 : 502 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        answer: 'An error occurred processing your request.',
        error: {
          code: 'API_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
