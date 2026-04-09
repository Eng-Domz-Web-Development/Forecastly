import { allRecords, deleteRecord, insertRecord, recordById, updateRecord as persistUpdateRecord } from '../lib/db.js';
import type { CreateRecordInput, PersistedRecord, UpdateRecordInput } from '../lib/types.js';
import { fetchDateRangeWeather, fetchWeather, geocodeQuery } from './weatherService.js';
import { validateDateRange, validateQuery } from './validation.js';

async function buildRecordPayload(input: CreateRecordInput, createdAt?: string): Promise<Omit<PersistedRecord, 'id'>> {
  validateQuery(input.query);
  validateDateRange(input);

  const location = await geocodeQuery(input.query.trim());
  const [bundle, dateRangeTemperatures] = await Promise.all([
    fetchWeather(location),
    fetchDateRangeWeather(location, input.startDate, input.endDate),
  ]);

  const now = new Date().toISOString();

  return {
    originalQuery: input.query.trim(),
    resolvedName: bundle.location.name,
    country: bundle.location.country,
    latitude: bundle.location.latitude,
    longitude: bundle.location.longitude,
    startDate: input.startDate,
    endDate: input.endDate,
    timezone: bundle.timezone,
    currentWeather: bundle.current,
    forecast: bundle.forecast,
    dateRangeTemperatures,
    extras: bundle.extras,
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
}

export async function createRecord(input: CreateRecordInput) {
  const payload = await buildRecordPayload(input);
  const record = insertRecord(payload);

  if (!record) {
    throw new Error('Unable to save the weather record.');
  }

  return record;
}

export function listRecords() {
  return allRecords();
}

export function getRecord(id: number) {
  return recordById(id);
}

export async function editRecord(id: number, input: UpdateRecordInput) {
  const existing = recordById(id);
  if (!existing) {
    return null;
  }

  const payload = await buildRecordPayload({
    query: input.query ?? existing.originalQuery,
    startDate: input.startDate ?? existing.startDate,
    endDate: input.endDate ?? existing.endDate,
  }, existing.createdAt);

  return persistUpdateRecord(id, payload);
}

export function removeRecord(id: number) {
  return deleteRecord(id);
}
