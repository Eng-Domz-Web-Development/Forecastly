import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createRecord,
  deleteRecord,
  exportRecordsUrl,
  fetchCurrentLocationWeather,
  fetchCurrentWeather,
  fetchRecords,
  updateRecord,
} from './lib/weather';
import { getWeatherVisual } from './lib/weatherVisuals';
import type { PersistedRecord, RecordInput, WeatherBundle } from './types';

const defaultQuery = 'Cairo';

const detailLabels = [
  { key: 'feelsLike', label: 'Feels like', suffix: '°' },
  { key: 'humidity', label: 'Humidity', suffix: '%' },
  { key: 'wind', label: 'Wind', suffix: ' km/h' },
  { key: 'rain', label: 'Rain', suffix: ' mm' },
] as const;

type AppState = 'idle' | 'loading' | 'success' | 'error';

function formatDay(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(date));
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function useScrollState() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
}

export default function App() {
  const [query, setQuery] = useState(defaultQuery);
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [status, setStatus] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [requestLabel, setRequestLabel] = useState('Search');
  const [records, setRecords] = useState<PersistedRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [recordForm, setRecordForm] = useState<RecordInput>({
    query: defaultQuery,
    startDate: todayIso(),
    endDate: plusDaysIso(4),
  });
  const scrolled = useScrollState();

  const heroVisual = useMemo(
    () =>
      getWeatherVisual(
        weather?.current.weatherCode ?? 1,
        weather?.current.isDay ?? true,
      ),
    [weather],
  );

  async function refreshRecords() {
    try {
      setRecordsLoading(true);
      setRecordError('');
      const data = await fetchRecords();
      setRecords(data);
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'Unable to load saved records.');
    } finally {
      setRecordsLoading(false);
    }
  }

  async function loadWeather(searchTerm: string, label = 'Search') {
    try {
      setStatus('loading');
      setErrorMessage('');
      setRequestLabel(label);
      const bundle = await fetchCurrentWeather(searchTerm);
      setWeather(bundle);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setWeather(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something unexpected happened while loading the weather.',
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      setStatus('error');
      setErrorMessage('Enter a city, ZIP/postal code, landmark, or coordinates.');
      return;
    }

    await loadWeather(query.trim());
  }

  async function handleCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('This browser does not support location access.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      setRequestLabel('Current location');

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const bundle = await fetchCurrentLocationWeather(
        position.coords.latitude,
        position.coords.longitude,
      );
      setWeather(bundle);
      setStatus('success');
    } catch (error) {
      const message =
        typeof GeolocationPositionError !== 'undefined' &&
        error instanceof GeolocationPositionError
          ? 'We could not access your location. Please allow location permission or search manually.'
          : error instanceof Error
            ? error.message
            : 'Current location lookup failed.';

      setStatus('error');
      setWeather(null);
      setErrorMessage(message);
    }
  }

  async function handleRecordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setRecordError('');
      const payload = {
        query: recordForm.query.trim(),
        startDate: recordForm.startDate,
        endDate: recordForm.endDate,
      };

      if (editingId) {
        await updateRecord(editingId, payload);
      } else {
        await createRecord(payload);
      }

      setEditingId(null);
      setRecordForm({
        query: query.trim() || defaultQuery,
        startDate: todayIso(),
        endDate: plusDaysIso(4),
      });
      await refreshRecords();
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'Unable to save record.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRecord(id: number) {
    try {
      setRecordError('');
      await deleteRecord(id);
      if (editingId === id) {
        setEditingId(null);
      }
      await refreshRecords();
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'Unable to delete record.');
    }
  }

  function startEditing(record: PersistedRecord) {
    setEditingId(record.id);
    setRecordForm({
      query: record.originalQuery,
      startDate: record.startDate,
      endDate: record.endDate,
    });
  }

  useEffect(() => {
    void loadWeather(defaultQuery, 'Starter');
    void refreshRecords();
  }, []);

  const currentDetailValues = weather
    ? {
        feelsLike: Math.round(weather.current.apparentTemperature),
        humidity: weather.current.humidity,
        wind: Math.round(weather.current.windSpeed),
        rain: weather.current.precipitation.toFixed(1),
      }
    : null;

  return (
    <div className={`app-shell accent-${heroVisual.accent}`}>
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
      <div className="ambient-grid" aria-hidden="true" />

      <header className={`topbar ${scrolled ? 'topbar-scrolled' : ''}`}>
        <div className="brand-block">
          <span className="brand-mark">FC</span>
          <div>
            <p className="eyebrow">Forecastly</p>
            <h1>Weather, refined.</h1>
          </div>
        </div>
        <a href="#records" className="ghost-link">
          Saved places
        </a>
      </header>

      <main>
        <section className="hero scene">
          <div className="hero-copy depth-4">
            <p className="section-kicker">Forecastly</p>
            <h2>Plan around the weather, not around the app.</h2>
            <p className="hero-description">
              Search a city, ZIP/postal code, landmark, or coordinates like{' '}
              <span>40.7128, -74.0060</span>. Get current conditions, a clean five-day outlook, and a saved history of the places you check most.
            </p>

            <form className="search-panel search-panel-priority" onSubmit={handleSubmit}>
              <label htmlFor="location" className="sr-only">
                Search location
              </label>
              <input
                id="location"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="City, landmark, postal code, or coordinates"
                autoComplete="off"
              />
              <button type="submit" className="primary-button">
                Find weather
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleCurrentLocation()}
              >
                Use my location
              </button>
            </form>

            <div className="micro-pills">
              <span>Live conditions</span>
              <span>Five-day outlook</span>
              <span>Saved history</span>
            </div>
          </div>

          <div className="hero-card depth-3">
            <div className="weather-orb" aria-hidden="true">
              <img src={heroVisual.icon} alt="" />
            </div>

            {status === 'loading' && (
              <div className="loading-card" aria-live="polite">
                <div className="loading-shine" />
                <p>{requestLabel} weather is loading...</p>
                <span>Checking the location and gathering the latest conditions.</span>
              </div>
            )}

            {status === 'error' && (
              <div className="error-card" role="alert">
                <p>Weather lookup hit a snag.</p>
                <span>{errorMessage}</span>
                <small>
                  Try another nearby place, a ZIP code, or a coordinate pair.
                </small>
              </div>
            )}

            {weather && status === 'success' && (
              <article className="current-card">
                <div className="current-card-top">
                  <div>
                    <p className="eyebrow">Now in {weather.location.country}</p>
                    <h3>{weather.location.name}</h3>
                  </div>
                  <span className="condition-tag">{heroVisual.label}</span>
                </div>

                <div className="temperature-line">
                  <strong>{Math.round(weather.current.temperature)}°</strong>
                  <div>
                    <p>{formatLongDate(weather.current.time)}</p>
                    <span>{weather.timezone}</span>
                  </div>
                </div>

                <div className="details-grid">
                  {detailLabels.map((item) => (
                    <div key={item.key} className="detail-tile">
                      <span>{item.label}</span>
                      <strong>
                        {currentDetailValues?.[item.key]}
                        {item.suffix}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="external-links">
                  <a href={weather.extras.googleMapsUrl} target="_blank" rel="noreferrer">
                    Open map
                  </a>
                  <a href={weather.extras.youtubeSearchUrl} target="_blank" rel="noreferrer">
                    Related videos
                  </a>
                  {weather.extras.wikipediaUrl && (
                    <a href={weather.extras.wikipediaUrl} target="_blank" rel="noreferrer">
                      Wikipedia
                    </a>
                  )}
                </div>
              </article>
            )}
          </div>
        </section>

        <section id="forecast" className="scene forecast-section forecast-section-premium">
          <div className="section-heading">
            <p className="section-kicker">Five-day forecast</p>
            <h3>The next few days, right where you need them.</h3>
          </div>

          <div className="forecast-grid">
            {(weather?.forecast ?? Array.from({ length: 5 })).map((day, index) => {
              const visual = day
                ? getWeatherVisual(day.weatherCode, true)
                : getWeatherVisual(index % 2 === 0 ? 1 : 61, true);

              return (
                <article
                  key={day ? day.date : `placeholder-${index}`}
                  className={`forecast-card ${!day ? 'forecast-card-loading' : ''}`}
                >
                  <div className="forecast-icon" aria-hidden="true">
                    <img src={visual.icon} alt="" />
                  </div>
                  <p>{day ? formatDay(day.date) : '...'}</p>
                  <strong>{day ? visual.label : 'Loading forecast'}</strong>
                  <div className="forecast-temps">
                    <span>{day ? `${Math.round(day.max)}°` : '--'}</span>
                    <small>{day ? `${Math.round(day.min)}°` : '--'}</small>
                  </div>
                  <em>
                    {day ? `${day.precipitationChance}% precip.` : 'Preparing outlook'}
                  </em>
                </article>
              );
            })}
          </div>
        </section>

        <section className="scene metrics-section">
          <div className="section-heading">
            <p className="section-kicker">Useful details</p>
            <h3>Everything that helps someone decide what their day looks like.</h3>
          </div>

          <div className="metrics-panel">
            <article className="metric-focus">
              <span className="metric-label">Sunrise</span>
              <strong>{weather ? formatTime(weather.forecast[0].sunrise) : '--:--'}</strong>
              <p>Useful for runners, commuters, and anyone planning the morning.</p>
            </article>

            <article className="metric-focus">
              <span className="metric-label">Sunset</span>
              <strong>{weather ? formatTime(weather.forecast[0].sunset) : '--:--'}</strong>
              <p>Easy at-a-glance daylight context without crowding the hero card.</p>
            </article>

            <article className="metric-focus">
              <span className="metric-label">Wikipedia</span>
              <strong>{weather?.extras.wikipediaTitle ?? 'Context ready'}</strong>
              <p>{weather?.extras.wikipediaSummary ?? 'Location summaries appear when available from the backend integration.'}</p>
            </article>
          </div>
        </section>

        <section id="records" className="scene records-section">
          <div className="section-heading">
            <p className="section-kicker">Saved forecasts</p>
            <h3>Keep locations and date ranges ready to revisit.</h3>
          </div>

          <div className="records-layout">
            <form className="record-form" onSubmit={handleRecordSubmit}>
              <div className="field-block">
                <label htmlFor="recordQuery">Location</label>
                <input
                  id="recordQuery"
                  value={recordForm.query}
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, query: event.target.value }))
                  }
                  placeholder="City, ZIP, landmark, or coordinates"
                />
              </div>

              <div className="field-grid">
                <div className="field-block">
                  <label htmlFor="startDate">Start date</label>
                  <input
                    id="startDate"
                    type="date"
                    value={recordForm.startDate}
                    onChange={(event) =>
                      setRecordForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                  />
                </div>
                <div className="field-block">
                  <label htmlFor="endDate">End date</label>
                  <input
                    id="endDate"
                    type="date"
                    value={recordForm.endDate}
                    onChange={(event) =>
                      setRecordForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {editingId ? 'Update record' : 'Create record'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingId(null);
                      setRecordForm({
                        query: query.trim() || defaultQuery,
                        startDate: todayIso(),
                        endDate: plusDaysIso(4),
                      });
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="export-row">
                <a href={exportRecordsUrl('json')} target="_blank" rel="noreferrer">Export JSON</a>
                <a href={exportRecordsUrl('csv')} target="_blank" rel="noreferrer">Export CSV</a>
                <a href={exportRecordsUrl('xml')} target="_blank" rel="noreferrer">Export XML</a>
                <a href={exportRecordsUrl('md')} target="_blank" rel="noreferrer">Export Markdown</a>
              </div>

              {recordError && <p className="inline-error">{recordError}</p>}
            </form>

            <div className="records-panel">
              <div className="records-header">
                <h4>Recent searches</h4>
                <span>{recordsLoading ? 'Refreshing...' : `${records.length} records`}</span>
              </div>

              <div className="record-grid">
                {records.map((record) => (
                  <article key={record.id} className="record-card">
                    <div className="record-card-top">
                      <div>
                        <p className="eyebrow">#{record.id} {record.country}</p>
                        <h5>{record.resolvedName}</h5>
                      </div>
                      <span className="condition-tag">{Math.round(record.currentWeather.temperature)}°C</span>
                    </div>

                    <p className="record-meta">
                      {record.startDate} to {record.endDate} • {record.timezone}
                    </p>
                    <p className="record-meta">Original query: {record.originalQuery}</p>

                    <div className="range-strip">
                      {record.dateRangeTemperatures.slice(0, 5).map((day) => (
                        <div key={day.date} className="range-chip">
                          <span>{formatDay(day.date)}</span>
                          <strong>{Math.round(day.mean)}°</strong>
                        </div>
                      ))}
                    </div>

                    <div className="external-links compact-links">
                      <a href={record.extras.googleMapsUrl} target="_blank" rel="noreferrer">Map</a>
                      <a href={record.extras.youtubeSearchUrl} target="_blank" rel="noreferrer">Videos</a>
                      {record.extras.wikipediaUrl && (
                        <a href={record.extras.wikipediaUrl} target="_blank" rel="noreferrer">Wiki</a>
                      )}
                    </div>

                    <div className="record-actions">
                      <button type="button" className="secondary-button" onClick={() => startEditing(record)}>
                        Edit
                      </button>
                      <button type="button" className="secondary-button danger-button" onClick={() => void handleDeleteRecord(record.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {!recordsLoading && records.length === 0 && (
                  <article className="record-card empty-card">
                    <h5>No saved forecasts yet</h5>
                    <p>Save a place and a date range to build your own weather archive.</p>
                  </article>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
