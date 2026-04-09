export interface LocationResult {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  min: number;
  max: number;
  precipitationChance: number;
  sunrise: string;
  sunset: string;
}

export interface DateRangeTemperature {
  date: string;
  min: number;
  max: number;
  mean: number;
  precipitationSum: number;
  weatherCode: number;
}

export interface WeatherExtras {
  googleMapsUrl: string;
  youtubeSearchUrl: string;
  wikipediaTitle?: string;
  wikipediaSummary?: string;
  wikipediaUrl?: string;
}

export interface WeatherBundle {
  location: LocationResult;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  extras: WeatherExtras;
}

export interface PersistedRecord {
  id: number;
  originalQuery: string;
  resolvedName: string;
  country: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  timezone: string;
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  dateRangeTemperatures: DateRangeTemperature[];
  extras: WeatherExtras;
  createdAt: string;
  updatedAt: string;
}

export interface RecordInput {
  query: string;
  startDate: string;
  endDate: string;
}
