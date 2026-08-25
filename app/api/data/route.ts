import { NextResponse } from 'next/server';
import { fetchDeals, fetchWorkOrders } from '@/lib/monday/client';
import { normalizeDeals, normalizeWorkOrders } from '@/lib/normalize';
import { calculatePipelineMetrics, calculateWorkOrderMetrics } from '@/lib/analytics';
import { Deal, WorkOrder, WorkOrderStatus, DealStage } from '@/types/models';
import { DataQualityIssue } from '@/types/normalization';

type RiskItem = {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  count?: number;
  affectedItems?: string[];
};

type GrowthRecommendation = {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  impact: string;
  action: string;
};

function detectRisks(
  deals: Deal[],
  workOrders: WorkOrder[],
  dealIssues: DataQualityIssue[],
  workOrderIssues: DataQualityIssue[]
): RiskItem[] {
  const risks: RiskItem[] = [];

  // Missing close dates
  const dealsWithoutCloseDates = deals.filter(d => !d.closeDate);
  if (dealsWithoutCloseDates.length > 0) {
    risks.push({
      severity: 'high',
      category: 'Missing Close Dates',
      description: String(dealsWithoutCloseDates.length) + ' deals have no expected close date',
      count: dealsWithoutCloseDates.length,
    });
  }

  // High-value deals without close dates
  const highValueThreshold = 500000;
  const highValueDealsNoDate = deals.filter(d => (d.value || 0) > highValueThreshold && !d.closeDate);
  if (highValueDealsNoDate.length > 0) {
    risks.push({
      severity: 'high',
      category: 'High-Value Risks',
      description: String(highValueDealsNoDate.length) + ' high-value deals missing close dates',
      count: highValueDealsNoDate.length,
    });
  }

  // Delayed work orders (past end date)
  const now = new Date();
  const delayedOrders = workOrders.filter(wo => {
    if (!wo.endDate) return false;
    return new Date(wo.endDate) < now && wo.status !== WorkOrderStatus.Completed;
  });
  if (delayedOrders.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'Delayed Work Orders',
      description: String(delayedOrders.length) + ' work orders are past their end date',
      count: delayedOrders.length,
    });
  }

  // Missing end dates
  const ordersWithoutEndDate = workOrders.filter(wo => !wo.endDate && wo.status !== WorkOrderStatus.Completed);
  if (ordersWithoutEndDate.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'Missing End Dates',
      description: String(ordersWithoutEndDate.length) + ' work orders have no end date',
      count: ordersWithoutEndDate.length,
    });
  }

  // Data quality issues
  const criticalIssues = [...dealIssues, ...workOrderIssues].filter(i => i.severity === 'high');
  if (criticalIssues.length > 0) {
    risks.push({
      severity: 'low',
      category: 'Data Quality',
      description: String(criticalIssues.length) + ' records have critical data quality issues',
      count: criticalIssues.length,
    });
  }

  return risks.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function generateGrowthRecommendations(
  deals: Deal[],
  workOrders: WorkOrder[],
  pipelineMetrics: any,
  workOrderMetrics: any
): GrowthRecommendation[] {
  const recommendations: GrowthRecommendation[] = [];

  // Analyze sector performance
  const sectors = Object.entries(pipelineMetrics.bySector as Record<string, any>)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalValue - a.totalValue);

  if (sectors.length > 0) {
    const topSector = sectors[0];
    const secondSector = sectors[1];
    
    if (secondSector && topSector.totalValue > secondSector.totalValue * 1.5) {
      recommendations.push({
        priority: 'high',
        category: 'Sector Diversification',
        recommendation: 'Reduce concentration risk by expanding in ' + secondSector.name + ' and other sectors',
        impact: 'Portfolio currently heavily weighted toward ' + topSector.name + ' (' + Math.round(topSector.percentage) + '%)',
        action: 'Target 3-5 new opportunities in ' + secondSector.name + ' sector this quarter',
      });
    }
  }

  // Analyze conversion rate
  const negotiationDeals = deals.filter(d => d.stage === DealStage.Negotiation);
  const proposalDeals = deals.filter(d => d.stage === DealStage.Proposal);
  
  if (negotiationDeals.length > 0) {
    const negotiationValue = negotiationDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    recommendations.push({
      priority: 'high',
      category: 'Deal Acceleration',
      recommendation: 'Focus on closing ' + negotiationDeals.length + ' deals in negotiation stage',
      impact: 'Could add ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(negotiationValue) + ' to revenue',
      action: 'Schedule executive reviews for top 5 deals, provide competitive pricing analysis',
    });
  }

  if (proposalDeals.length > proposalDeals.length * 0.3) {
    recommendations.push({
      priority: 'medium',
      category: 'Pipeline Velocity',
      recommendation: 'Accelerate proposal stage deals to negotiation',
      impact: 'Move ' + proposalDeals.length + ' deals closer to close',
      action: 'Send follow-up proposals, schedule demo calls, address objections proactively',
    });
  }

  // Analyze work order efficiency
  const completedOrders = workOrders.filter(wo => wo.status === WorkOrderStatus.Completed);
  const inProgressOrders = workOrders.filter(wo => wo.status === WorkOrderStatus.InProgress);
  
  if (workOrderMetrics.completionRate < 0.6) {
    recommendations.push({
      priority: 'medium',
      category: 'Operational Efficiency',
      recommendation: 'Improve work order completion rate from ' + Math.round(workOrderMetrics.completionRate * 100) + '% to 75%+',
      impact: 'Faster project delivery enables taking on more clients',
      action: 'Review bottlenecks in ' + inProgressOrders.length + ' active projects, allocate additional resources',
    });
  }

  // Analyze deal value
  const avgDealSize = pipelineMetrics.averageDealSize || 0;
  const highValueDeals = deals.filter(d => (d.value || 0) > avgDealSize * 1.5);
  
  if (highValueDeals.length < deals.length * 0.2) {
    recommendations.push({
      priority: 'medium',
      category: 'Deal Size Optimization',
      recommendation: 'Target larger enterprise deals to increase average deal size',
      impact: 'Current avg: ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(avgDealSize),
      action: 'Develop enterprise packages, bundle services, cross-sell to existing high-value clients',
    });
  }

  // Lead generation
  const leadDeals = deals.filter(d => d.stage === DealStage.Lead);
  if (leadDeals.length < deals.length * 0.3) {
    recommendations.push({
      priority: 'high',
      category: 'Lead Generation',
      recommendation: 'Increase top-of-funnel lead generation',
      impact: 'Low lead count (' + leadDeals.length + ') may impact future revenue',
      action: 'Launch targeted campaigns in Energy and Infrastructure sectors, attend 2-3 industry events',
    });
  }

  // Data quality improvement
  if (pipelineMetrics.dataQuality && pipelineMetrics.dataQuality.successRate < 0.95) {
    recommendations.push({
      priority: 'low',
      category: 'Data Quality',
      recommendation: 'Improve CRM data completeness',
      impact: 'Better forecasting and reporting accuracy',
      action: 'Require close dates and deal values for all opportunities, run weekly data cleanup',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function GET() {
  try {
    console.log('[API /data] Starting data fetch...');
    console.log('[API /data] Environment:', process.env.NODE_ENV);
    console.log('[API /data] MONDAY_API_TOKEN present:', !!process.env.MONDAY_API_TOKEN);
    console.log('[API /data] MONDAY_DEALS_BOARD_ID:', process.env.MONDAY_DEALS_BOARD_ID);
    console.log('[API /data] MONDAY_WORK_ORDERS_BOARD_ID:', process.env.MONDAY_WORK_ORDERS_BOARD_ID);
    
    // Fetch raw data
    const rawDeals = await fetchDeals();
    console.log('[API /data] Raw deals fetched:', rawDeals.length);
    
    const rawWorkOrders = await fetchWorkOrders();
    console.log('[API /data] Raw work orders fetched:', rawWorkOrders.length);

    // Normalize data
    const normalizedDeals = normalizeDeals(rawDeals);
    console.log('[API /data] Deals normalized:', normalizedDeals.data.length);
    console.log('[API /data] Deals success rate:', normalizedDeals.successRate);
    
    const normalizedWorkOrders = normalizeWorkOrders(rawWorkOrders);
    console.log('[API /data] Work orders normalized:', normalizedWorkOrders.data.length);

    // Calculate metrics
    const pipelineMetrics = calculatePipelineMetrics(normalizedDeals.data, normalizedDeals.qualityIssues);
    const workOrderMetrics = calculateWorkOrderMetrics(normalizedWorkOrders.data, normalizedWorkOrders.qualityIssues);

    // Detect risks
    const risks = detectRisks(
      normalizedDeals.data,
      normalizedWorkOrders.data,
      normalizedDeals.qualityIssues,
      normalizedWorkOrders.qualityIssues
    );

    // Generate growth recommendations
    const growthRecommendations = generateGrowthRecommendations(
      normalizedDeals.data,
      normalizedWorkOrders.data,
      pipelineMetrics,
      workOrderMetrics
    );

    return NextResponse.json({
      success: true,
      lastRefresh: new Date().toISOString(),
      coverage: {
        deals: {
          retrieved: rawDeals.length,
          normalized: normalizedDeals.data.length,
          issues: normalizedDeals.qualityIssues.length,
          successRate: normalizedDeals.successRate,
        },
        workOrders: {
          retrieved: rawWorkOrders.length,
          normalized: normalizedWorkOrders.data.length,
          issues: normalizedWorkOrders.qualityIssues.length,
          successRate: normalizedWorkOrders.successRate,
        },
      },
      overview: {
        totalPipelineValue: pipelineMetrics.totalValue,
        activeDealCount: pipelineMetrics.dealCount,
        activeProjectCount: workOrderMetrics.projectCount,
        topSector: Object.entries(pipelineMetrics.bySector)
          .sort(([, a], [, b]) => b.totalValue - a.totalValue)[0]?.[0] || 'Unknown',
      },
      metrics: {
        pipeline: pipelineMetrics,
        workOrders: workOrderMetrics,
      },
      risks,
      growthRecommendations,
    });
  } catch (error: any) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: error.message || 'Failed to fetch data from Monday.com',
        },
      },
      { status: 500 }
    );
  }
}
