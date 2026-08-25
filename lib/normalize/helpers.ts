import { DataQualityIssue } from '../../types/normalization';

export function normalizeNumericValue(
  rawValue: any,
  fieldName: string,
  recordId: string,
  issues: DataQualityIssue[]
): number | null {
  if (rawValue == null || rawValue === '') {
    issues.push({
      recordId,
      field: fieldName,
      issueType: 'missing',
      rawValue,
      normalizedValue: null,
      severity: 'medium',
    });
    return null;
  }

  if (typeof rawValue === 'string') {
    const cleaned = rawValue.trim().toLowerCase();
    if (cleaned === 'n/a' || cleaned === 'na' || cleaned === 'none' || cleaned === '-') {
      issues.push({
        recordId,
        field: fieldName,
        issueType: 'missing',
        rawValue,
        normalizedValue: null,
        severity: 'medium',
      });
      return null;
    }

    const parsed = parseFloat(rawValue.replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed)) {
      issues.push({
        recordId,
        field: fieldName,
        issueType: 'malformed',
        rawValue,
        normalizedValue: null,
        severity: 'high',
      });
      return null;
    }

    issues.push({
      recordId,
      field: fieldName,
      issueType: 'inconsistent',
      rawValue,
      normalizedValue: parsed,
      severity: 'low',
    });
    return parsed;
  }

  if (typeof rawValue === 'number') {
    if (isNaN(rawValue) || !isFinite(rawValue)) {
      issues.push({
        recordId,
        field: fieldName,
        issueType: 'invalid',
        rawValue,
        normalizedValue: null,
        severity: 'high',
      });
      return null;
    }
    return rawValue;
  }

  issues.push({
    recordId,
    field: fieldName,
    issueType: 'malformed',
    rawValue,
    normalizedValue: null,
    severity: 'high',
  });
  return null;
}

export function normalizeDateValue(
  rawValue: any,
  fieldName: string,
  recordId: string,
  issues: DataQualityIssue[]
): Date | null {
  if (rawValue == null || rawValue === '') {
    issues.push({
      recordId,
      field: fieldName,
      issueType: 'missing',
      rawValue,
      normalizedValue: null,
      severity: 'medium',
    });
    return null;
  }

  if (typeof rawValue === 'string') {
    const cleaned = rawValue.trim().toLowerCase();
    if (cleaned === 'n/a' || cleaned === 'na' || cleaned === '-') {
      issues.push({
        recordId,
        field: fieldName,
        issueType: 'missing',
        rawValue,
        normalizedValue: null,
        severity: 'medium',
      });
      return null;
    }

    const date = new Date(rawValue);
    if (isNaN(date.getTime())) {
      issues.push({
        recordId,
        field: fieldName,
        issueType: 'malformed',
        rawValue,
        normalizedValue: null,
        severity: 'high',
      });
      return null;
    }
    return date;
  }

  return null;
}

export function normalizeStringValue(
  rawValue: any,
  fieldName: string,
  recordId: string,
  issues: DataQualityIssue[]
): string | null {
  if (rawValue == null || rawValue === '') {
    issues.push({
      recordId,
      field: fieldName,
      issueType: 'missing',
      rawValue,
      normalizedValue: null,
      severity: 'medium',
    });
    return null;
  }

  const cleaned = String(rawValue).trim();
  if (cleaned.toLowerCase() === 'n/a' || cleaned.toLowerCase() === 'na' || cleaned === '-') {
    issues.push({
      recordId,
      field: fieldName,
      issueType: 'missing',
      rawValue,
      normalizedValue: null,
      severity: 'medium',
    });
    return null;
  }

  // Title case
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeEnumValue<T extends string>(
  rawValue: any,
  enumValues: Record<string, T>,
  defaultValue: T,
  fieldName: string,
  recordId: string,
  issues: DataQualityIssue[]
): T {
  if (rawValue == null || rawValue === '') {
    issues.push({
      recordId,
      field: fieldName,
      issueType: 'missing',
      rawValue,
      normalizedValue: defaultValue,
      severity: 'medium',
    });
    return defaultValue;
  }

  const cleaned = String(rawValue).trim().toLowerCase().replace(/[_\s]/g, '_');
  
  for (const [key, value] of Object.entries(enumValues)) {
    if (value.toLowerCase().replace(/[_\s]/g, '_') === cleaned) {
      return value;
    }
  }

  issues.push({
    recordId,
    field: fieldName,
    issueType: 'invalid',
    rawValue,
    normalizedValue: defaultValue,
    severity: 'medium',
  });
  return defaultValue;
}
