import { Deal, DealStage, WorkOrder, WorkOrderStatus } from '../../types/models';
import {
  PipelineMetrics,
  WorkOrderMetrics,
  SectorMetrics,
  StageMetrics,
  StatusMetrics,
  SectorComparison,
} from '../../types/analytics';
import { generateDataQualityReport } from '../normalize';
import { DataQualityIssue } from '../../types/normalization';

export function calculatePipelineMetrics(
  deals: Deal[],
  qualityIssues: DataQualityIssue[] = []
): PipelineMetrics {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  
  const weightedValue = deals.reduce((sum, deal) => {
    const value = deal.value || 0;
    const probability = deal.probability / 100;
    return sum + (value * probability);
  }, 0);

  const dealsWithValue = deals.filter(d => d.value !== null);
  const averageDealSize = dealsWithValue.length > 0 ? totalValue / dealsWithValue.length : 0;

  const closedWonDeals = deals.filter(d => d.stage === DealStage.ClosedWon);
  const totalActiveDeals = deals.filter(d => d.stage !== DealStage.ClosedLost);
  const conversionRate = totalActiveDeals.length > 0 ? closedWonDeals.length / totalActiveDeals.length : 0;

  const bySector: Record<string, SectorMetrics> = {};
  const sectorGroups: Record<string, Deal[]> = {};
  
  for (const deal of deals) {
    const sector = deal.sector || 'Unknown';
    if (!sectorGroups[sector]) {
      sectorGroups[sector] = [];
    }
    sectorGroups[sector].push(deal);
  }

  for (const [sector, sectorDeals] of Object.entries(sectorGroups)) {
    const sectorValue = sectorDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    bySector[sector] = {
      sector,
      totalValue: sectorValue,
      count: sectorDeals.length,
      averageSize: sectorDeals.length > 0 ? sectorValue / sectorDeals.length : 0,
      percentage: totalValue > 0 ? (sectorValue / totalValue) * 100 : 0,
    };
  }

  const byStage: Record<string, StageMetrics> = {};
  const stageGroups: Record<string, Deal[]> = {};
  
  for (const deal of deals) {
    const stage = deal.stage;
    if (!stageGroups[stage]) {
      stageGroups[stage] = [];
    }
    stageGroups[stage].push(deal);
  }

  for (const [stage, stageDeals] of Object.entries(stageGroups)) {
    const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    byStage[stage] = {
      stage,
      count: stageDeals.length,
      totalValue: stageValue,
      averageValue: stageDeals.length > 0 ? stageValue / stageDeals.length : 0,
    };
  }

  const topDeals = [...deals]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 10);

  return {
    totalValue,
    weightedValue,
    dealCount: deals.length,
    averageDealSize,
    conversionRate,
    bySector,
    byStage,
    topDeals,
    dataQuality: generateDataQualityReport(qualityIssues, deals.length),
  };
}

export function calculateWorkOrderMetrics(
  workOrders: WorkOrder[],
  qualityIssues: DataQualityIssue[] = []
): WorkOrderMetrics {
  const totalValue = workOrders.reduce((sum, wo) => sum + (wo.projectValue || 0), 0);
  
  const ordersWithValue = workOrders.filter(wo => wo.projectValue !== null);
  const averageProjectSize = ordersWithValue.length > 0 ? totalValue / ordersWithValue.length : 0;

  const completedOrders = workOrders.filter(wo => wo.status === WorkOrderStatus.Completed);
  const completionRate = workOrders.length > 0 ? completedOrders.length / workOrders.length : 0;

  const bySector: Record<string, SectorMetrics> = {};
  const sectorGroups: Record<string, WorkOrder[]> = {};
  
  for (const wo of workOrders) {
    const sector = wo.sector || 'Unknown';
    if (!sectorGroups[sector]) {
      sectorGroups[sector] = [];
    }
    sectorGroups[sector].push(wo);
  }

  for (const [sector, sectorOrders] of Object.entries(sectorGroups)) {
    const sectorValue = sectorOrders.reduce((sum, wo) => sum + (wo.projectValue || 0), 0);
    bySector[sector] = {
      sector,
      totalValue: sectorValue,
      count: sectorOrders.length,
      averageSize: sectorOrders.length > 0 ? sectorValue / sectorOrders.length : 0,
      percentage: totalValue > 0 ? (sectorValue / totalValue) * 100 : 0,
    };
  }

  const byStatus: Record<string, StatusMetrics> = {};
  const statusGroups: Record<string, WorkOrder[]> = {};
  
  for (const wo of workOrders) {
    const status = wo.status;
    if (!statusGroups[status]) {
      statusGroups[status] = [];
    }
    statusGroups[status].push(wo);
  }

  for (const [status, statusOrders] of Object.entries(statusGroups)) {
    const statusValue = statusOrders.reduce((sum, wo) => sum + (wo.projectValue || 0), 0);
    byStatus[status] = {
      status,
      count: statusOrders.length,
      totalValue: statusValue,
      averageValue: statusOrders.length > 0 ? statusValue / statusOrders.length : 0,
    };
  }

  const topProjects = [...workOrders]
    .sort((a, b) => (b.projectValue || 0) - (a.projectValue || 0))
    .slice(0, 10);

  return {
    totalValue,
    projectCount: workOrders.length,
    averageProjectSize,
    completionRate,
    bySector,
    byStatus,
    topProjects,
    dataQuality: generateDataQualityReport(qualityIssues, workOrders.length),
  };
}

export function compareSectorPerformance(
  deals: Deal[],
  workOrders: WorkOrder[],
  sector: string
): SectorComparison {
  const sectorDeals = deals.filter(d => d.sector?.toLowerCase() === sector.toLowerCase());
  const sectorOrders = workOrders.filter(wo => wo.sector?.toLowerCase() === sector.toLowerCase());

  const pipelineValue = sectorDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const workOrderValue = sectorOrders.reduce((sum, wo) => sum + (wo.projectValue || 0), 0);

  const pipelineDeals = sectorDeals.length;
  const workOrderProjects = sectorOrders.length;

  const conversionRate = pipelineDeals > 0 ? workOrderProjects / pipelineDeals : 0;

  const insights: string[] = [];
  
  if (pipelineValue > workOrderValue && workOrderValue > 0) {
    const diff = ((pipelineValue - workOrderValue) / workOrderValue * 100).toFixed(0);
    insights.push('Pipeline value exceeds work orders by ' + diff + '%');
  } else if (workOrderValue > pipelineValue) {
    insights.push('Strong execution pipeline with healthy conversion');
  }

  if (conversionRate > 0.5) {
    insights.push('Healthy conversion rate indicates strong sector performance');
  }

  return {
    sector,
    pipelineValue,
    workOrderValue,
    pipelineDeals,
    workOrderProjects,
    conversionRate,
    insights,
  };
}