// Data Normalization Types
export interface DataQualityIssue {
  recordId: string;
  field: string;
  issueType: 'missing' | 'malformed' | 'inconsistent' | 'invalid';
  rawValue: any;
  normalizedValue: any;
  severity: 'low' | 'medium' | 'high';
}

export interface NormalizationResult<T> {
  data: T[];
  qualityIssues: DataQualityIssue[];
  successRate: number;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  issuesByType: Record<string, number>;
  affectedFields: string[];
  recommendations: string[];
}

export interface ColumnMapping {
  deals: {
    dealValue: string;
    closeDate: string;
    sector: string;
    stage: string;
    probability: string;
    clientName: string;
  };
  workOrders: {
    projectValue: string;
    startDate: string;
    endDate: string;
    sector: string;
    status: string;
    clientName: string;
  };
}
