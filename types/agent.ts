// AI Agent Types
export type QueryIntentType = 
  | 'pipeline_query'
  | 'work_order_query'
  | 'cross_board_comparison'
  | 'leadership_update'
  | 'sector_analysis';

export interface QueryIntent {
  type: QueryIntentType;
  requiredDatasets: ('deals' | 'work_orders')[];
  filters: IntentFilters;
  timeframe?: { start?: Date; end?: Date };
  analysisType: 'summary' | 'detailed' | 'comparison' | 'trend';
  confidence: number;
}

export interface IntentFilters {
  sectors?: string[];
  stages?: string[];
  statuses?: string[];
  clients?: string[];
}

export interface ClarificationRequest {
  question: string;
  options?: string[];
  reason: string;
}

export interface ConversationContext {
  previousQueries: string[];
  previousIntents: QueryIntent[];
}

export interface Visualization {
  type: 'bar' | 'line' | 'pie' | 'table';
  data: any;
  title: string;
  description?: string;
}

export interface QueryResponse {
  success: boolean;
  answer: string;
  metrics?: any;
  visualizations?: Visualization[];
  dataQuality?: any;
  suggestedFollowUps?: string[];
  error?: {
    code: string;
    message: string;
    recovery?: string;
  };
}
