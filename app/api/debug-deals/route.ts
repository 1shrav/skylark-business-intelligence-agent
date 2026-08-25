import { NextResponse } from 'next/server';
import { fetchDeals } from '@/lib/monday/client';

export async function GET() {
  try {
    const rawDeals = await fetchDeals();
    
    if (rawDeals.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deals found in board',
        boardId: process.env.MONDAY_DEALS_BOARD_ID,
      });
    }

    const firstDeal = rawDeals[0];
    const columnInfo = firstDeal.column_values.map(col => ({
      id: col.id,
      text: col.text,
      value: col.value,
    }));

    return NextResponse.json({
      success: true,
      totalDeals: rawDeals.length,
      boardId: process.env.MONDAY_DEALS_BOARD_ID,
      sampleDeal: {
        id: firstDeal.id,
        name: firstDeal.name,
        columns: columnInfo,
      },
      allDeals: rawDeals.map(d => ({
        id: d.id,
        name: d.name,
        columnCount: d.column_values.length,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}