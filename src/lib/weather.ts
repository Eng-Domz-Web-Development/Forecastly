import type { PersistedRecord, RecordInput, WeatherBundle } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export async function fetchCurrentWeather(query: string) {
  return fetchJson<WeatherBundle>(`/api/weather/current?query=${encodeURIComponent(query)}`);
}

export async function fetchCurrentLocationWeather(latitude: number, longitude: number) {
  return fetchJson<WeatherBundle>(
    `/api/weather/current-location?lat=${latitude}&lon=${longitude}`,
  );
}

export async function fetchRecords() {
  return fetchJson<PersistedRecord[]>('/api/records');
}

export async function createRecord(input: RecordInput) {
  return fetchJson<PersistedRecord>('/api/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function updateRecord(id: number, input: RecordInput) {
  return fetchJson<PersistedRecord>(`/api/records/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function deleteRecord(id: number) {
  const response = await fetch(`/api/records/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? 'Delete failed.');
  }
}

export function exportRecordsUrl(format: 'json' | 'csv' | 'md' | 'xml') {
  return `/api/records/export/${format}`;
}
