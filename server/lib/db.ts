import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { PersistedRecord } from './types.js';

const databasePath = join(process.cwd(), 'data', 'forecastly.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_query TEXT NOT NULL,
    resolved_name TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    timezone TEXT NOT NULL,
    current_weather_json TEXT NOT NULL,
    forecast_json TEXT NOT NULL,
    date_range_temperatures_json TEXT NOT NULL,
    extras_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function parseRecord(row: Record<string, unknown>): PersistedRecord {
  return {
    id: Number(row.id),
    originalQuery: String(row.original_query),
    resolvedName: String(row.resolved_name),
    country: String(row.country),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    timezone: String(row.timezone),
    currentWeather: JSON.parse(String(row.current_weather_json)),
    forecast: JSON.parse(String(row.forecast_json)),
    dateRangeTemperatures: JSON.parse(String(row.date_range_temperatures_json)),
    extras: JSON.parse(String(row.extras_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function allRecords() {
  const statement = db.prepare('SELECT * FROM weather_records ORDER BY datetime(created_at) DESC');
  return statement.all().map((row) => parseRecord(row as Record<string, unknown>));
}

export function recordById(id: number) {
  const statement = db.prepare('SELECT * FROM weather_records WHERE id = ?');
  const row = statement.get(id) as Record<string, unknown> | undefined;
  return row ? parseRecord(row) : null;
}

export function insertRecord(record: Omit<PersistedRecord, 'id'>) {
  const statement = db.prepare(`
    INSERT INTO weather_records (
      original_query,
      resolved_name,
      country,
      latitude,
      longitude,
      start_date,
      end_date,
      timezone,
      current_weather_json,
      forecast_json,
      date_range_temperatures_json,
      extras_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    record.originalQuery,
    record.resolvedName,
    record.country,
    record.latitude,
    record.longitude,
    record.startDate,
    record.endDate,
    record.timezone,
    JSON.stringify(record.currentWeather),
    JSON.stringify(record.forecast),
    JSON.stringify(record.dateRangeTemperatures),
    JSON.stringify(record.extras),
    record.createdAt,
    record.updatedAt,
  );

  return recordById(Number(result.lastInsertRowid));
}

export function updateRecord(id: number, record: Omit<PersistedRecord, 'id' | 'createdAt'>) {
  const statement = db.prepare(`
    UPDATE weather_records
    SET original_query = ?, resolved_name = ?, country = ?, latitude = ?, longitude = ?,
        start_date = ?, end_date = ?, timezone = ?, current_weather_json = ?, forecast_json = ?,
        date_range_temperatures_json = ?, extras_json = ?, updated_at = ?
    WHERE id = ?
  `);

  statement.run(
    record.originalQuery,
    record.resolvedName,
    record.country,
    record.latitude,
    record.longitude,
    record.startDate,
    record.endDate,
    record.timezone,
    JSON.stringify(record.currentWeather),
    JSON.stringify(record.forecast),
    JSON.stringify(record.dateRangeTemperatures),
    JSON.stringify(record.extras),
    record.updatedAt,
    id,
  );

  return recordById(id);
}

export function deleteRecord(id: number) {
  const statement = db.prepare('DELETE FROM weather_records WHERE id = ?');
  const result = statement.run(id);
  return result.changes > 0;
}
