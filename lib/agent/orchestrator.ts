import { QueryResponse } from '../../types/agent';
import { fetchDeals, fetchWorkOrders } from '../monday/client';
import { normalizeDeals, normalizeWorkOrders } from '../normalize';
import { calculatePipelineMetrics, calculateWorkOrderMetrics, compareSectorPerformance } from '../analytics';
import { classifyIntent, explainMetrics } from '../ai';

export async function processQuery(query: string): Promise<QueryResponse> {
  try {
    const directResponse = respondToQuestionWithoutSnapshot(query);
    if (directResponse) return directResponse;

    const intent = await classifyIntent(query);
    let rawDeals: any[] = [];
    let rawWorkOrders: any[] = [];

    if (intent.requiredDatasets.includes('deals')) {
      rawDeals = await fetchDeals();
    }

    if (intent.requiredDatasets.includes('work_orders')) {
      rawWorkOrders = await fetchWorkOrders();
    }

    const normalizedDeals = intent.requiredDatasets.includes('deals')
      ? normalizeDeals(rawDeals)
      : { data: [], qualityIssues: [], successRate: 1 };

    const normalizedWorkOrders = intent.requiredDatasets.includes('work_orders')
      ? normalizeWorkOrders(rawWorkOrders)
      : { data: [], qualityIssues: [], successRate: 1 };

    let metrics: any;
    let dataQuality: any;

    switch (intent.type) {
      case 'pipeline_query':
      case 'sector_analysis':
        metrics = calculatePipelineMetrics(normalizedDeals.data, normalizedDeals.qualityIssues);
        dataQuality = metrics.dataQuality;
        
        if (intent.filters.sectors && intent.filters.sectors.length > 0) {
          const sector = intent.filters.sectors[0];
          metrics = {
            ...metrics,
            sectorFocus: sector,
            sectorMetrics: metrics.bySector[sector] || { sector, totalValue: 0, count: 0, averageSize: 0, percentage: 0 },
          };
        }
        break;

      case 'work_order_query':
        metrics = calculateWorkOrderMetrics(normalizedWorkOrders.data, normalizedWorkOrders.qualityIssues);
        dataQuality = metrics.dataQuality;
        break;

      case 'cross_board_comparison':
        const sector = intent.filters.sectors?.[0] || 'All';
        if (sector === 'All') {
          const pipelineMetrics = calculatePipelineMetrics(normalizedDeals.data, normalizedDeals.qualityIssues);
          const workOrderMetrics = calculateWorkOrderMetrics(normalizedWorkOrders.data, normalizedWorkOrders.qualityIssues);
          metrics = {
            pipeline: pipelineMetrics,
            workOrders: workOrderMetrics,
          };
        } else {
          metrics = compareSectorPerformance(normalizedDeals.data, normalizedWorkOrders.data, sector);
        }
        dataQuality = normalizedDeals.qualityIssues.length > 0 || normalizedWorkOrders.qualityIssues.length > 0
          ? { successRate: Math.min(normalizedDeals.successRate, normalizedWorkOrders.successRate) }
          : undefined;
        break;

      case 'leadership_update':
        const pipelineMetrics = calculatePipelineMetrics(normalizedDeals.data, normalizedDeals.qualityIssues);
        const workOrderMetrics = calculateWorkOrderMetrics(normalizedWorkOrders.data, normalizedWorkOrders.qualityIssues);
        metrics = {
          pipeline: pipelineMetrics,
          workOrders: workOrderMetrics,
          overview: {
            totalPipelineValue: pipelineMetrics.totalValue,
            totalWorkOrderValue: workOrderMetrics.totalValue,
            dealCount: pipelineMetrics.dealCount,
            projectCount: workOrderMetrics.projectCount,
            conversionRate: pipelineMetrics.conversionRate,
            completionRate: workOrderMetrics.completionRate,
          },
        };
        dataQuality = {
          successRate: Math.min(normalizedDeals.successRate, normalizedWorkOrders.successRate),
        };
        break;

      default:
        throw new Error('Unknown intent type: ' + intent.type);
    }

    const explanation = await explainMetrics(query, metrics, dataQuality);
    const suggestedFollowUps = generateFollowUps(intent);

    return {
      success: true,
      answer: explanation,
      metrics,
      dataQuality,
      suggestedFollowUps,
    };
  } catch (error: any) {
    console.error('Query processing error:', error);
    return {
      success: false,
      answer: 'I encountered an error processing your query. Please try again.',
      error: {
        code: 'PROCESSING_ERROR',
        message: error.message || 'Unknown error',
        recovery: 'Please check your Monday.com and OpenAI API credentials in .env.local',
      },
    };
  }
}

/**
 * Growth is a comparison, not a single current-state metric. The connected
 * boards contain current deal and work-order records, but no historical
 * pipeline snapshots, so returning a pipeline total as "growth" is wrong.
 */
function respondToQuestionWithoutSnapshot(query: string): QueryResponse | null {
  const normalized = query.toLowerCase();
  if (/\b(growth|grown|increase|decrease|trend|month.over.month|year.over.year)\b/.test(normalized)) {
    return {
      success: true,
      answer: 'Growth cannot be calculated from a single live snapshot. To measure it accurately, Skylark needs a comparison point such as last month\'s pipeline snapshot or a dated revenue history.\n\nI can still show the current pipeline, the leading sectors, or work-order completion today.',
      suggestedFollowUps: ['How is our pipeline looking this quarter?', 'Which sectors have the highest pipeline?', 'Give me a leadership update'],
    };
  }
  if (/^(hi|hello|hey|how are you)[!?.,\s]*$/i.test(query.trim())) {
    return {
      success: true,
      answer: 'I am ready to analyse your live Monday.com data. Ask about pipeline value, leading sectors, work orders, or an executive update.',
      suggestedFollowUps: ['How is our pipeline looking this quarter?', 'Which sectors have the highest pipeline?'],
    };
  }
  return null;
}

function generateFollowUps(intent: any): string[] {
  const followUps: string[] = [];

  switch (intent.type) {
    case 'pipeline_query':
      followUps.push('Which sectors have the highest pipeline?');
      followUps.push('Compare pipeline with work orders');
      followUps.push('Show me the top deals');
      break;
    case 'work_order_query':
      followUps.push('Which projects are delayed?');
      followUps.push('Compare with sales pipeline');
      followUps.push('Show completion rates by sector');
      break;
    case 'cross_board_comparison':
      followUps.push('Give me a leadership update');
      followUps.push('Which sectors are underperforming?');
      break;
    case 'leadership_update':
      followUps.push('Dive deeper into Energy sector');
      followUps.push('Show me at-risk deals');
      followUps.push('What are the data quality issues?');
      break;
  }

  return followUps;
}
