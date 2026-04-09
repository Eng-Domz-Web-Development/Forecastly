import type { PersistedRecord } from '../lib/types.js';

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}

export function exportJson(records: PersistedRecord[]) {
  return JSON.stringify(records, null, 2);
}

export function exportCsv(records: PersistedRecord[]) {
  const rows = [
    [
      'id',
      'query',
      'resolvedName',
      'country',
      'startDate',
      'endDate',
      'latitude',
      'longitude',
      'currentTemperature',
      'createdAt',
    ].join(','),
    ...records.map((record) =>
      [
        record.id,
        escapeCsv(record.originalQuery),
        escapeCsv(record.resolvedName),
        escapeCsv(record.country),
        record.startDate,
        record.endDate,
        record.latitude,
        record.longitude,
        record.currentWeather.temperature,
        record.createdAt,
      ].join(','),
    ),
  ];

  // Prefix with UTF-8 BOM so spreadsheet apps like Excel preserve Arabic and other non-Latin text.
  return `\uFEFF${rows.join('\r\n')}`;
}

export function exportMarkdown(records: PersistedRecord[]) {
  const lines = [
    '# Forecastly Weather Records',
    '',
    '| ID | Query | Resolved location | Date range | Current temp | Maps | YouTube |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...records.map(
      (record) =>
        `| ${record.id} | ${record.originalQuery} | ${record.resolvedName}, ${record.country} | ${record.startDate} to ${record.endDate} | ${record.currentWeather.temperature}°C | [Map](${record.extras.googleMapsUrl}) | [Videos](${record.extras.youtubeSearchUrl}) |`,
    ),
  ];

  return lines.join('\n');
}

export function exportXml(records: PersistedRecord[]) {
  const items = records
    .map(
      (record) => `
  <record id="${record.id}">
    <query>${record.originalQuery}</query>
    <resolvedName>${record.resolvedName}</resolvedName>
    <country>${record.country}</country>
    <startDate>${record.startDate}</startDate>
    <endDate>${record.endDate}</endDate>
    <currentTemperature>${record.currentWeather.temperature}</currentTemperature>
    <googleMapsUrl>${record.extras.googleMapsUrl}</googleMapsUrl>
    <youtubeSearchUrl>${record.extras.youtubeSearchUrl}</youtubeSearchUrl>
  </record>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<forecastlyRecords>${items}\n</forecastlyRecords>`;
}
