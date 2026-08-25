// Domain Models
export enum DealStage {
  Lead = 'lead',
  Qualified = 'qualified',
  Proposal = 'proposal',
  Negotiation = 'negotiation',
  ClosedWon = 'closed_won',
  ClosedLost = 'closed_lost'
}

export enum WorkOrderStatus {
  Planning = 'planning',
  InProgress = 'in_progress',
  OnHold = 'on_hold',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface RecordQuality {
  isComplete: boolean;
  missingFields: string[];
  normalizedFields: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface Deal {
  id: string;
  name: string;
  value: number | null;
  closeDate: Date | null;
  sector: string | null;
  stage: DealStage;
  probability: number;
  clientName: string | null;
  createdAt: Date;
  updatedAt: Date;
  dataQuality: RecordQuality;
}

export interface WorkOrder {
  id: string;
  name: string;
  projectValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  sector: string | null;
  status: WorkOrderStatus;
  clientName: string | null;
  createdAt: Date;
  updatedAt: Date;
  dataQuality: RecordQuality;
}
