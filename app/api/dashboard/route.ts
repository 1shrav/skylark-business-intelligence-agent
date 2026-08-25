import { NextResponse } from 'next/server';
import { calculatePipelineMetrics, calculateWorkOrderMetrics } from '@/lib/analytics';
import { fetchDeals, fetchWorkOrders } from '@/lib/monday/client';
import { normalizeDeals, normalizeWorkOrders } from '@/lib/normalize';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rawDeals, rawWorkOrders] = await Promise.all([fetchDeals(), fetchWorkOrders()]);
    const deals = normalizeDeals(rawDeals);
    const workOrders = normalizeWorkOrders(rawWorkOrders);
    const pipeline = calculatePipelineMetrics(deals.data, deals.qualityIssues);
    const operations = calculateWorkOrderMetrics(workOrders.data, workOrders.qualityIssues);
    const highValueThreshold = pipeline.averageDealSize || 0;
    const risks = [
      ...deals.data.filter((deal) => deal.closeDate === null && (deal.value ?? 0) >= highValueThreshold).slice(0, 3).map((deal) => ({ level: 'high', text: `${deal.name} is a high-value opportunity without an expected close date.` })),
      ...deals.data.filter((deal) => deal.updatedAt.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000).slice(0, 2).map((deal) => ({ level: 'medium', text: `${deal.name} has not been updated in over 30 days.` })),
      ...workOrders.data.filter((order) => order.endDate === null).slice(0, 2).map((order) => ({ level: 'medium', text: `${order.name} has no planned completion date.` })),
    ].slice(0, 5);

    return NextResponse.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      pipeline,
      workOrders: operations,
      coverage: {
        deals: { retrieved: rawDeals.length, normalized: deals.data.filter((deal) => deal.dataQuality.isComplete).length, issues: deals.qualityIssues.length },
        workOrders: { retrieved: rawWorkOrders.length, normalized: workOrders.data.filter((order) => order.dataQuality.isComplete).length, issues: workOrders.qualityIssues.length },
      },
      risks,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ success: false, error: 'Unable to refresh Monday.com data.' }, { status: 502 });
  }
}
