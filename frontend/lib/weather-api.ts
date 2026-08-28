import { api } from './api';

export interface CurrentWeather {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timestamp: number;
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  weather_id: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  sunrise: number;
  sunset: number;
}

export interface HourlyWeather {
  timestamp: number;
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  pop: number;
}

export interface DailyWeather {
  date: string;
  timestamp: number;
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  humidity: number;
  wind_speed: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  pop: number;
}

export interface HistoryWeather {
  date: string;
  timestamp: number;
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  is_mock: true;
}

type LocationParams = { lat?: number; lon?: number };

/** Unwrap response interceptor { success, data } */
function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

export const weatherApi = {
  getCurrent: (params?: LocationParams) =>
    api.get<{ data: CurrentWeather }>('/weather/current', { params }).then(unwrap<CurrentWeather>),

  getHistory: (params?: LocationParams) =>
    api.get<{ data: HistoryWeather[] }>('/weather/history', { params }).then(unwrap<HistoryWeather[]>),

  getHourly: (params?: LocationParams) =>
    api.get<{ data: HourlyWeather[] }>('/weather/hourly', { params }).then(unwrap<HourlyWeather[]>),

  getDaily: (params?: LocationParams) =>
    api.get<{ data: DailyWeather[] }>('/weather/daily', { params }).then(unwrap<DailyWeather[]>),
};

// ── Formatting helpers ────────────────────────────────────────────────────────

export function owmIcon(icon: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${icon}@${size}.png`;
}

export function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function windDirection(deg: number): string {
  const dirs = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];
  return dirs[Math.round(deg / 45) % 8];
}
