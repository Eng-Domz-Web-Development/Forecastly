import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRecord, editRecord, getRecord, listRecords, removeRecord } from './services/recordService.js';
import { exportCsv, exportJson, exportMarkdown, exportXml } from './services/exportService.js';
import { fetchWeather, geocodeQuery, reverseGeocode } from './services/weatherService.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());

function sendError(res: express.Response, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  res.status(status).json({ message });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/weather/current', async (req, res) => {
  try {
    const query = String(req.query.query ?? '');
    const location = await geocodeQuery(query);
    const bundle = await fetchWeather(location);
    res.json(bundle);
  } catch (error) {
    sendError(res, error, 400);
  }
});

app.get('/api/weather/current-location', async (req, res) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new Error('Latitude and longitude are required.');
    }

    const location = await reverseGeocode(latitude, longitude);
    const bundle = await fetchWeather(location);
    res.json(bundle);
  } catch (error) {
    sendError(res, error, 400);
  }
});

app.get('/api/records', (_req, res) => {
  res.json(listRecords());
});

app.get('/api/records/:id', (req, res) => {
  const record = getRecord(Number(req.params.id));
  if (!record) {
    res.status(404).json({ message: 'Record not found.' });
    return;
  }

  res.json(record);
});

app.post('/api/records', async (req, res) => {
  try {
    const record = await createRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    sendError(res, error, 400);
  }
});

app.put('/api/records/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const record = await editRecord(id, req.body);

    if (!record) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }

    res.json(record);
  } catch (error) {
    sendError(res, error, 400);
  }
});

app.delete('/api/records/:id', (req, res) => {
  const deleted = removeRecord(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ message: 'Record not found.' });
    return;
  }

  res.status(204).send();
});

app.get('/api/records/export/:format', (req, res) => {
  const format = String(req.params.format).toLowerCase();
  const records = listRecords();

  if (format === 'json') {
    res.type('application/json').send(exportJson(records));
    return;
  }

  if (format === 'csv') {
    res.type('text/csv').send(exportCsv(records));
    return;
  }

  if (format === 'md') {
    res.type('text/markdown').send(exportMarkdown(records));
    return;
  }

  if (format === 'xml') {
    res.type('application/xml').send(exportXml(records));
    return;
  }

  res.status(400).json({ message: 'Unsupported export format.' });
});

const distDir = join(process.cwd(), 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', async (_req, res, next) => {
    try {
      const html = await readFile(join(distDir, 'index.html'), 'utf8');
      res.type('html').send(html);
    } catch (error) {
      next(error);
    }
  });
}

app.listen(port, () => {
  console.log(`Forecastly API running on http://localhost:${port}`);
});
