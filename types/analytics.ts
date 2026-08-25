import { Deal, WorkOrder } from './models';
import { DataQualityReport } from './normalization';

// Analytics Types
export interface SectorMetrics {
  sector: string;
  totalValue: number;
  count: number;
  averageSize: number;
  percentage: number;
}

export interface StageMetrics {
  stage: string;
  count: number;
  totalValue: number;
  averageValue: number;
  conversionRate?: number;
}

export interface StatusMetrics {
  status: string;
  count: number;
  totalValue: number;
  averageValue: number;
  completionRate?: number;
}

export interface PipelineMetrics {
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  averageDealSize: number;
  conversionRate: number;
  bySector: Record<string, SectorMetrics>;
  byStage: Record<string, StageMetrics>;
  topDeals: Deal[];
  dataQuality: DataQualityReport;
}

export interface WorkOrderMetrics {
  totalValue: number;
  projectCount: number;
  averageProjectSize: number;
  completionRate: number;
  bySector: Record<string, SectorMetrics>;
  byStatus: Record<string, StatusMetrics>;
  topProjects: WorkOrder[];
  dataQuality: DataQualityReport;
}

export interface SectorComparison {
  sector: string;
  pipelineValue: number;
  workOrderValue: number;
  pipelineDeals: number;
  workOrderProjects: number;
  conversionRate: number;
  insights: string[];
}

export interface KeyMetric {
  name: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'stable';
  context?: string;
  severity?: 'good' | 'neutral' | 'concerning';
}

export interface TrendInsight {
  category: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  dataSupport: string;
}

export interface RiskAlert {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  affectedArea: string;
}

export interface LeadershipUpdate {
  executiveSummary: string;
  keyMetrics: KeyMetric[];
  trends: TrendInsight[];
  risks: RiskAlert[];
  recommendations: string[];
  dataQualityCaveats: string[];
}
