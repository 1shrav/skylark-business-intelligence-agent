import { Deal, DealStage, WorkOrder, WorkOrderStatus } from '../../types/models';
import { RawDeal, RawWorkOrder } from '../monday/client';
import { DataQualityIssue, NormalizationResult, DataQualityReport } from '../../types/normalization';
import {
  normalizeNumericValue,
  normalizeDateValue,
  normalizeStringValue,
} from './helpers';

function getColumnValue(item: any, columnId: string): string | null {
  const column = item.column_values?.find((cv: any) => cv.id === columnId);
  return column?.text || column?.value || null;
}

function probabilityFromLabel(value: string | null): string | null {
  if (!value) return null;
  const probability = { high: '75', medium: '50', low: '25' }[value.trim().toLowerCase()];
  return probability || value;
}

function normalizeDealStage(value: string | null, recordId: string, issues: DataQualityIssue[]): DealStage {
  const text = value?.toLowerCase() || '';
  if (text.includes('closed won') || text.includes('won')) return DealStage.ClosedWon;
  if (text.includes('closed lost') || text.includes('lost')) return DealStage.ClosedLost;
  if (text.includes('negotiation')) return DealStage.Negotiation;
  if (text.includes('proposal') || text.includes('commercial')) return DealStage.Proposal;
  if (text.includes('qualified') || text.includes('sales qualified')) return DealStage.Qualified;
  if (!text) issues.push({ recordId, field: 'stage', issueType: 'missing', rawValue: value, normalizedValue: DealStage.Lead, severity: 'medium' });
  return DealStage.Lead;
}

function normalizeWorkOrderStatus(value: string | null, recordId: string, issues: DataQualityIssue[]): WorkOrderStatus {
  const text = value?.toLowerCase() || '';
  if (text.includes('completed')) return WorkOrderStatus.Completed;
  if (text.includes('progress') || text.includes('ongoing')) return WorkOrderStatus.InProgress;
  if (text.includes('hold')) return WorkOrderStatus.OnHold;
  if (text.includes('cancel')) return WorkOrderStatus.Cancelled;
  if (!text) issues.push({ recordId, field: 'status', issueType: 'missing', rawValue: value, normalizedValue: WorkOrderStatus.Planning, severity: 'medium' });
  return WorkOrderStatus.Planning;
}

export function normalizeDeals(rawDeals: RawDeal[]): NormalizationResult<Deal> {
  const normalized: Deal[] = [];
  const qualityIssues: DataQualityIssue[] = [];
  let successfulRecords = 0;

  for (const raw of rawDeals) {
    try {
      const issues: DataQualityIssue[] = [];

      const value = normalizeNumericValue(
        getColumnValue(raw, 'text_mm6j1dcs'),
        'value',
        raw.id,
        issues
      );

      const closeDate = normalizeDateValue(
        getColumnValue(raw, 'text_mm6jfdhy') || getColumnValue(raw, 'text_mm6jm6cq'),
        'closeDate',
        raw.id,
        issues
      );

      const sector = normalizeStringValue(
        getColumnValue(raw, 'text_mm6jygha'),
        'sector',
        raw.id,
        issues
      );

      const clientName = normalizeStringValue(
        getColumnValue(raw, 'text_mm6jehy8'),
        'clientName',
        raw.id,
        issues
      );

      const stage = normalizeDealStage(getColumnValue(raw, 'text_mm6jm347'), raw.id, issues);

      let probability = normalizeNumericValue(
        probabilityFromLabel(getColumnValue(raw, 'text_mm6jxtee')),
        'probability',
        raw.id,
        issues
      );

      if (probability === null) {
        const stageDefaults: Record<DealStage, number> = {
          [DealStage.Lead]: 10,
          [DealStage.Qualified]: 25,
          [DealStage.Proposal]: 50,
          [DealStage.Negotiation]: 75,
          [DealStage.ClosedWon]: 100,
          [DealStage.ClosedLost]: 0,
        };
        probability = stageDefaults[stage];
      }

      const deal: Deal = {
        id: raw.id,
        name: raw.name || 'Unnamed Deal',
        value,
        closeDate,
        sector,
        stage,
        probability: probability || 0,
        clientName,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at),
        dataQuality: {
          isComplete: issues.filter(i => i.severity === 'high').length === 0,
          missingFields: issues.filter(i => i.issueType === 'missing').map(i => i.field),
          normalizedFields: issues.filter(i => i.issueType === 'inconsistent').map(i => i.field),
          confidence: issues.filter(i => i.severity === 'high').length === 0 ? 'high' : 'medium',
        },
      };

      normalized.push(deal);
      qualityIssues.push(...issues);

      if (deal.dataQuality.isComplete) {
        successfulRecords++;
      }
    } catch (error) {
      qualityIssues.push({
        recordId: raw.id,
        field: 'entire_record',
        issueType: 'malformed',
        rawValue: raw,
        normalizedValue: null,
        severity: 'high',
      });
    }
  }

  return {
    data: normalized,
    qualityIssues,
    successRate: rawDeals.length > 0 ? successfulRecords / rawDeals.length : 0,
  };
}

export function normalizeWorkOrders(rawWorkOrders: RawWorkOrder[]): NormalizationResult<WorkOrder> {
  const normalized: WorkOrder[] = [];
  const qualityIssues: DataQualityIssue[] = [];
  let successfulRecords = 0;

  for (const raw of rawWorkOrders) {
    try {
      const issues: DataQualityIssue[] = [];

      const projectValue = normalizeNumericValue(
        getColumnValue(raw, 'text_mm6jnktt'),
        'projectValue',
        raw.id,
        issues
      );

      const startDate = normalizeDateValue(
        getColumnValue(raw, 'text_mm6j4x5p'),
        'startDate',
        raw.id,
        issues
      );

      const endDate = normalizeDateValue(
        getColumnValue(raw, 'text_mm6j2wyt'),
        'endDate',
        raw.id,
        issues
      );

      const sector = normalizeStringValue(
        getColumnValue(raw, 'text_mm6j4mme'),
        'sector',
        raw.id,
        issues
      );

      const clientName = normalizeStringValue(
        getColumnValue(raw, 'text_mm6jfrq2'),
        'clientName',
        raw.id,
        issues
      );

      const status = normalizeWorkOrderStatus(getColumnValue(raw, 'text_mm6j7hk1') || getColumnValue(raw, 'status'), raw.id, issues);

      const workOrder: WorkOrder = {
        id: raw.id,
        name: raw.name || 'Unnamed Project',
        projectValue,
        startDate,
        endDate,
        sector,
        status,
        clientName,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at),
        dataQuality: {
          isComplete: issues.filter(i => i.severity === 'high').length === 0,
          missingFields: issues.filter(i => i.issueType === 'missing').map(i => i.field),
          normalizedFields: issues.filter(i => i.issueType === 'inconsistent').map(i => i.field),
          confidence: issues.filter(i => i.severity === 'high').length === 0 ? 'high' : 'medium',
        },
      };

      normalized.push(workOrder);
      qualityIssues.push(...issues);

      if (workOrder.dataQuality.isComplete) {
        successfulRecords++;
      }
    } catch (error) {
      qualityIssues.push({
        recordId: raw.id,
        field: 'entire_record',
        issueType: 'malformed',
        rawValue: raw,
        normalizedValue: null,
        severity: 'high',
      });
    }
  }

  return {
    data: normalized,
    qualityIssues,
    successRate: rawWorkOrders.length > 0 ? successfulRecords / rawWorkOrders.length : 0,
  };
}

export function generateDataQualityReport(issues: DataQualityIssue[], totalRecords: number): DataQualityReport {
  const issuesByType: Record<string, number> = {};
  const affectedFieldsSet = new Set<string>();

  for (const issue of issues) {
    issuesByType[issue.issueType] = (issuesByType[issue.issueType] || 0) + 1;
    affectedFieldsSet.add(issue.field);
  }

  const recommendations: string[] = [];
  if (issuesByType.missing > totalRecords * 0.1) {
    recommendations.push('Review required fields in Monday.com and ensure data entry completeness');
  }
  if (issuesByType.malformed > 0) {
    recommendations.push('Standardize data formats in Monday.com columns');
  }

  return {
    totalRecords,
    validRecords: totalRecords - issues.filter(i => i.severity === 'high').length,
    issuesByType,
    affectedFields: Array.from(affectedFieldsSet),
    recommendations,
  };
}
