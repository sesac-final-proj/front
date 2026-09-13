const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface WeatherForecast {
  dateTime: string;
  temperature: number;
  condition: string;
  iconUrl: string;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
}

export interface NeighborhoodWeather {
  updatedAt: string;
  current: WeatherForecast;
  forecast: WeatherForecast[];
  airQuality?: {
    pm10: number;
    pm25: number;
    grade: "좋음" | "보통" | "나쁨" | "매우 나쁨";
    scope: string;
  } | null;
}

export async function fetchNeighborhoodWeather(lat: number, lng: number, signal?: AbortSignal): Promise<NeighborhoodWeather> {
  const path = `/api/v1/local/weather?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
  const url = API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("날씨 정보를 불러오지 못했어요.");
  return response.json() as Promise<NeighborhoodWeather>;
}

export function getWeatherDistributionUrl(): string {
  const path = "/api/v1/local/weather/distribution";
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}
