import type {
  CurrentWeather,
  DateRangeTemperature,
  ForecastDay,
  LocationResult,
  WeatherBundle,
  WeatherExtras,
} from '../lib/types.js';

const COORDINATE_PATTERN =
  /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/;

function buildLocationName(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(', ');
}

async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Forecastly/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export function parseCoordinateInput(query: string) {
  const match = query.match(COORDINATE_PATTERN);

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
}

export async function geocodeQuery(query: string): Promise<LocationResult> {
  const coordinateMatch = parseCoordinateInput(query);

  if (coordinateMatch) {
    return reverseGeocode(
      coordinateMatch.latitude,
      coordinateMatch.longitude,
      'Coordinates',
    );
  }

  const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('format', 'jsonv2');
  searchUrl.searchParams.set('limit', '1');
  searchUrl.searchParams.set('addressdetails', '1');

  type NominatimSearch = Array<{
    place_id: number;
    lat: string;
    lon: string;
    name?: string;
    display_name: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  }>;

  const results = await fetchJson<NominatimSearch>(
    searchUrl.toString(),
    'Unable to find that location right now.',
  );

  if (!results.length) {
    throw new Error(
      'No matching location was found. Try a nearby city, ZIP code, landmark, or coordinates.',
    );
  }

  const place = results[0];
  const locality =
    place.address?.city ??
    place.address?.town ??
    place.address?.village ??
    place.address?.municipality ??
    place.name;
  const secondary =
    place.address?.state ?? place.address?.county ?? place.display_name;

  return {
    id: String(place.place_id),
    name: buildLocationName([locality, secondary]),
    country: place.address?.country ?? 'Unknown',
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  fallbackLabel = 'Current location',
): Promise<LocationResult> {
  const reverseUrl = new URL('https://nominatim.openstreetmap.org/reverse');
  reverseUrl.searchParams.set('lat', String(latitude));
  reverseUrl.searchParams.set('lon', String(longitude));
  reverseUrl.searchParams.set('format', 'jsonv2');
  reverseUrl.searchParams.set('zoom', '12');

  type NominatimReverse = {
    place_id: number;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      country?: string;
      suburb?: string;
    };
  };

  const place = await fetchJson<NominatimReverse>(
    reverseUrl.toString(),
    'Unable to resolve your current location.',
  );

  const locality =
    place.address?.city ??
    place.address?.town ??
    place.address?.village ??
    place.address?.suburb ??
    fallbackLabel;

  return {
    id: String(place.place_id),
    name: buildLocationName([locality, place.address?.state]),
    country: place.address?.country ?? 'Unknown',
    latitude,
    longitude,
  };
}

function mapForecast(raw: {
  time: string[];
  weather_code: number[];
  temperature_2m_min: number[];
  temperature_2m_max: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
}): ForecastDay[] {
  return raw.time.map((date, index) => ({
    date,
    weatherCode: raw.weather_code[index],
    min: raw.temperature_2m_min[index],
    max: raw.temperature_2m_max[index],
    precipitationChance: raw.precipitation_probability_max[index],
    sunrise: raw.sunrise[index],
    sunset: raw.sunset[index],
  }));
}

async function fetchWikipedia(location: LocationResult): Promise<Partial<WeatherExtras>> {
  try {
    const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', location.name.split(',')[0] ?? location.name);
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('utf8', '1');

    const search = await fetchJson<{
      query?: { search?: Array<{ title: string }> };
    }>(searchUrl.toString(), 'Wikipedia lookup failed.');

    const title = search.query?.search?.[0]?.title;
    if (!title) {
      return {};
    }

    const summaryUrl = new URL(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );

    const summary = await fetchJson<{
      title: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    }>(summaryUrl.toString(), 'Wikipedia summary failed.');

    return {
      wikipediaTitle: summary.title,
      wikipediaSummary: summary.extract,
      wikipediaUrl: summary.content_urls?.desktop?.page,
    };
  } catch {
    return {};
  }
}

export async function fetchWeather(location: LocationResult): Promise<WeatherBundle> {
  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(location.latitude));
  forecastUrl.searchParams.set('longitude', String(location.longitude));
  forecastUrl.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'is_day',
    ].join(','),
  );
  forecastUrl.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),
  );
  forecastUrl.searchParams.set('forecast_days', '5');
  forecastUrl.searchParams.set('timezone', 'auto');

  type ForecastResponse = {
    timezone: string;
    current: {
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      precipitation: number;
      weather_code: number;
      wind_speed_10m: number;
      is_day: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_min: number[];
      temperature_2m_max: number[];
      precipitation_probability_max: number[];
      sunrise: string[];
      sunset: string[];
    };
  };

  const [forecast, wikipedia] = await Promise.all([
    fetchJson<ForecastResponse>(
      forecastUrl.toString(),
      'Weather data could not be loaded at the moment.',
    ),
    fetchWikipedia(location),
  ]);

  const extras: WeatherExtras = {
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
    youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${location.name} travel weather`)}`,
    ...wikipedia,
  };

  return {
    location,
    timezone: forecast.timezone,
    current: {
      time: forecast.current.time,
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      humidity: forecast.current.relative_humidity_2m,
      precipitation: forecast.current.precipitation,
      weatherCode: forecast.current.weather_code,
      windSpeed: forecast.current.wind_speed_10m,
      isDay: Boolean(forecast.current.is_day),
    },
    forecast: mapForecast(forecast.daily),
    extras,
  };
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function joinDailyRange(parts: Array<DateRangeTemperature[]>) {
  return parts.flat().sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchRangeSlice(
  location: LocationResult,
  startDate: string,
  endDate: string,
  endpoint: string,
) {
  const rangeUrl = new URL(endpoint);
  rangeUrl.searchParams.set('latitude', String(location.latitude));
  rangeUrl.searchParams.set('longitude', String(location.longitude));
  rangeUrl.searchParams.set('start_date', startDate);
  rangeUrl.searchParams.set('end_date', endDate);
  rangeUrl.searchParams.set(
    'daily',
    [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'weather_code',
    ].join(','),
  );
  rangeUrl.searchParams.set('timezone', 'auto');

  type RangeResponse = {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      temperature_2m_mean: number[];
      precipitation_sum: number[];
      weather_code: number[];
    };
  };

  const result = await fetchJson<RangeResponse>(
    rangeUrl.toString(),
    'Date range weather could not be loaded.',
  );

  return result.daily.time.map((date, index) => ({
    date,
    min: result.daily.temperature_2m_min[index],
    max: result.daily.temperature_2m_max[index],
    mean: result.daily.temperature_2m_mean[index],
    precipitationSum: result.daily.precipitation_sum[index],
    weatherCode: result.daily.weather_code[index],
  }));
}

export async function fetchDateRangeWeather(
  location: LocationResult,
  startDate: string,
  endDate: string,
): Promise<DateRangeTemperature[]> {
  const today = new Date();
  const todayIso = toIsoDate(today);

  if (endDate < todayIso) {
    return fetchRangeSlice(
      location,
      startDate,
      endDate,
      'https://archive-api.open-meteo.com/v1/archive',
    );
  }

  if (startDate >= todayIso) {
    return fetchRangeSlice(
      location,
      startDate,
      endDate,
      'https://api.open-meteo.com/v1/forecast',
    );
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = toIsoDate(yesterday);

  const [past, future] = await Promise.all([
    fetchRangeSlice(
      location,
      startDate,
      yesterdayIso,
      'https://archive-api.open-meteo.com/v1/archive',
    ),
    fetchRangeSlice(
      location,
      todayIso,
      endDate,
      'https://api.open-meteo.com/v1/forecast',
    ),
  ]);

  return joinDailyRange([past, future]);
}

export function summarizeCurrentTemperature(current: CurrentWeather) {
  return `${Math.round(current.temperature)}°C currently, feels like ${Math.round(current.apparentTemperature)}°C.`;
}
