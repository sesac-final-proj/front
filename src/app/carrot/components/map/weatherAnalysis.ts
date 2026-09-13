import type { LocalBusiness } from "@/types";
import type { NeighborhoodWeather, WeatherForecast } from "@/services/weatherService";

export interface WeatherRisk {
  type: "침수" | "결빙" | "폭염";
  message: string;
  level: "주의" | "경계";
}

function hourLabel(dateTime: string) {
  return `${Number(dateTime.slice(8, 10))}시`;
}

function tradeScore(item: WeatherForecast) {
  return Math.max(0, 100 - item.precipitationProbability - item.windSpeed * 4 - (item.temperature <= 1 || item.temperature >= 33 ? 30 : 0));
}

export function analyzeWeather(weather: NeighborhoodWeather, dangerSignals: LocalBusiness[]) {
  const current = weather.current;
  const hasFloodSignal = dangerSignals.some((item) => /침수|호우|하천/.test(`${item.name} ${item.summary} ${item.riskType ?? ""}`));
  const risks: WeatherRisk[] = [];
  if (current.precipitationProbability >= 60 || current.condition.includes("비")) {
    risks.push({ type: "침수", level: hasFloodSignal ? "경계" : "주의", message: hasFloodSignal ? "침수 위험 신호가 있어 하천변·지하차도는 피하세요." : "강수 예보가 있어 하천변과 저지대 이동에 주의하세요." });
  }
  if (current.temperature <= 1 && (current.precipitationProbability >= 20 || current.condition.includes("눈"))) {
    risks.push({ type: "결빙", level: "주의", message: "노면 결빙 가능성이 있어 도보·자전거 이동을 줄이세요." });
  }
  if (current.temperature >= 33) {
    risks.push({ type: "폭염", level: "경계", message: "폭염 시간대입니다. 거래는 주민센터·지하철역 등 실내 공공장소를 우선하세요." });
  }
  const best = [...weather.forecast].sort((a, b) => tradeScore(b) - tradeScore(a))[0] ?? current;
  const outdoorOkay = best.precipitationProbability < 30 && best.temperature > 1 && best.temperature < 33;
  return {
    risks,
    bestTime: hourLabel(best.dateTime),
    tradeScore: Math.round(tradeScore(best)),
    tradeMessage: outdoorOkay
      ? `${hourLabel(best.dateTime)}가 가장 무난해요. 지하철역·주민센터 앞처럼 밝은 곳을 추천해요.`
      : `${hourLabel(best.dateTime)}도 실내 공공장소 거래를 권장해요.`,
  };
}
