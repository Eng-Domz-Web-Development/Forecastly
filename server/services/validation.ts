import type { CreateRecordInput } from '../lib/types.js';

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export function validateQuery(query: string) {
  if (!query.trim()) {
    throw new Error('A location is required.');
  }
}

export function validateDateRange(input: CreateRecordInput) {
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) {
    throw new Error('Dates must be in YYYY-MM-DD format.');
  }

  const start = toDate(input.startDate);
  const end = toDate(input.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('One or both dates are invalid.');
  }

  if (start > end) {
    throw new Error('Start date must be before or equal to end date.');
  }

  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (dayCount > 31) {
    throw new Error('Date range must be 31 days or less.');
  }
}
