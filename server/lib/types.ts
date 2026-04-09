export type LocationResult = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
};

export type ForecastDay = {
  date: string;
  weatherCode: number;
  min: number;
  max: number;
  precipitationChance: number;
  sunrise: string;
  sunset: string;
};

export type DateRangeTemperature = {
  date: string;
  min: number;
  max: number;
  mean: number;
  precipitationSum: number;
  weatherCode: number;
};

export type WeatherExtras = {
  googleMapsUrl: string;
  youtubeSearchUrl: string;
  wikipediaTitle?: string;
  wikipediaSummary?: string;
  wikipediaUrl?: string;
};

export type WeatherBundle = {
  location: LocationResult;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  extras: WeatherExtras;
};

export type PersistedRecord = {
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
};

export type CreateRecordInput = {
  query: string;
  startDate: string;
  endDate: string;
};

export type UpdateRecordInput = Partial<CreateRecordInput>;
