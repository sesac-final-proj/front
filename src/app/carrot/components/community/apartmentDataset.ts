export interface ApartmentInfo {
  name: string;
  addr: string;
  units: string;
  lat: number;
  lng: number;
  district: string;
  dong: string;
}

export interface NearbyApartment extends ApartmentInfo {
  dist: string;
  distMeters: number;
}

// 서울시 주요 자치구별 대표 아파트 단지 데이터베이스
export const SEOUL_APARTMENT_DB: ApartmentInfo[] = [
  // 송파구
  { name: "헬리오시티", addr: "서울 송파구 송파대로 345", units: "9,510세대", lat: 37.4982, lng: 127.1186, district: "송파구", dong: "가락동" },
  { name: "파크리오", addr: "서울 송파구 올림픽로 435", units: "6,864세대", lat: 37.5205, lng: 127.1062, district: "송파구", dong: "신천동" },
  { name: "잠실엘스", addr: "서울 송파구 올림픽로 99", units: "5,678세대", lat: 37.5135, lng: 127.0865, district: "송파구", dong: "잠실동" },
  { name: "리센츠", addr: "서울 송파구 올림픽로 145", units: "5,563세대", lat: 37.5126, lng: 127.0934, district: "송파구", dong: "잠실동" },
  { name: "올림픽선수기자촌", addr: "서울 송파구 양재대로 1218", units: "5,540세대", lat: 37.5118, lng: 127.1274, district: "송파구", dong: "방이동" },
  { name: "송파삼성래미안", addr: "서울 송파구 오금로 383", units: "845세대", lat: 37.5047, lng: 127.1183, district: "송파구", dong: "송파동" },
  { name: "트리지움", addr: "서울 송파구 잠실로 62", units: "3,696세대", lat: 37.5098, lng: 127.0955, district: "송파구", dong: "잠실동" },
  { name: "잠실레이크팰리스", addr: "서울 송파구 잠실로 88", units: "2,678세대", lat: 37.5085, lng: 127.0988, district: "송파구", dong: "잠실동" },
  { name: "송파파인타운", addr: "서울 송파구 송파대로8길 10", units: "3,130세대", lat: 37.4832, lng: 127.1265, district: "송파구", dong: "장지역" },
  { name: "올림픽훼미리타운", addr: "서울 송파구 중대로 24", units: "4,494세대", lat: 37.4935, lng: 127.1142, district: "송파구", dong: "문정동" },

  // 강남구
  { name: "디에이치자이개포", addr: "서울 강남구 영동대로 22", units: "1,996세대", lat: 37.4891, lng: 127.0725, district: "강남구", dong: "개포동" },
  { name: "래미안대치팰리스", addr: "서울 강남구 삼성로 151", units: "1,608세대", lat: 37.4952, lng: 127.0612, district: "강남구", dong: "대치동" },
  { name: "은마아파트", addr: "서울 강남구 삼성로 212", units: "4,424세대", lat: 37.4988, lng: 127.0664, district: "강남구", dong: "대치동" },
  { name: "압구정현대", addr: "서울 강남구 압구정로 201", units: "6,335세대", lat: 37.5312, lng: 127.0315, district: "강남구", dong: "압구정동" },
  { name: "도곡렉슬", addr: "서울 강남구 선릉로 221", units: "3,002세대", lat: 37.4925, lng: 127.0543, district: "강남구", dong: "도곡동" },
  { name: "개포래미안포레스트", addr: "서울 강남구 개포로 264", units: "2,296세대", lat: 37.4815, lng: 127.0532, district: "강남구", dong: "개포동" },

  // 서초구
  { name: "반포자이", addr: "서울 서초구 신반포로 270", units: "3,410세대", lat: 37.5032, lng: 127.0125, district: "서초구", dong: "반포동" },
  { name: "아크로리버파크", addr: "서울 서초구 신반포로15길 19", units: "1,612세대", lat: 37.5078, lng: 126.9965, district: "서초구", dong: "반포동" },
  { name: "래미안원베일리", addr: "서울 서초구 신반포로 100", units: "2,990세대", lat: 37.5065, lng: 127.0012, district: "서초구", dong: "반포동" },
  { name: "서초그랑자이", addr: "서울 서초구 효령로 403", units: "1,446세대", lat: 37.4895, lng: 127.0265, district: "서초구", dong: "서초동" },

  // 영등포구
  { name: "당산삼성래미안4차", addr: "서울 영등포구 당산로 214", units: "1,391세대", lat: 37.5348, lng: 126.9035, district: "영등포구", dong: "당산동" },
  { name: "당산센트럴아이파크", addr: "서울 영등포구 당산로42길 25", units: "802세대", lat: 37.5315, lng: 126.9012, district: "영등포구", dong: "당산동" },
  { name: "문래자이", addr: "서울 영등포구 당산로 34", units: "1,302세대", lat: 37.5185, lng: 126.8965, district: "영등포구", dong: "문래동" },
  { name: "문래힐스테이트", addr: "서울 영등포구 선유로 63", units: "776세대", lat: 37.5192, lng: 126.8925, district: "영등포구", dong: "문래동" },
  { name: "신길센트럴자이", addr: "서울 영등포구 신길로 108", units: "1,008세대", lat: 37.5025, lng: 126.9112, district: "영등포구", dong: "신길동" },
  { name: "보라매SK뷰", addr: "서울 영등포구 여의대방로 43", units: "1,546세대", lat: 37.4985, lng: 126.9185, district: "영등포구", dong: "신길동" },

  // 마포구
  { name: "마포래미안푸르지오", addr: "서울 마포구 마포대로 195", units: "3,885세대", lat: 37.5548, lng: 126.9535, district: "마포구", dong: "아현동" },
  { name: "마포프레스티지자이", addr: "서울 마포구 대흥로24길 24", units: "1,699세대", lat: 37.5512, lng: 126.9485, district: "마포구", dong: "염리동" },
  { name: "신촌그랑자이", addr: "서울 마포구 대흥로 175", units: "1,248세대", lat: 37.5562, lng: 126.9432, district: "마포구", dong: "대흥동" },
  { name: "마포한강푸르지오", addr: "서울 마포구 월드컵로 27", units: "398세대", lat: 37.5495, lng: 126.9125, district: "마포구", dong: "합정동" },

  // 노원구
  { name: "공릉해링턴플레이스", addr: "서울 노원구 공릉로 232", units: "1,308세대", lat: 37.6258, lng: 127.0735, district: "노원구", dong: "공릉동" },
  { name: "공릉태릉현대", addr: "서울 노원구 화랑로 465", units: "986세대", lat: 37.6212, lng: 127.0815, district: "노원구", dong: "공릉동" },
  { name: "중계그린", addr: "서울 노원구 동일로 1335", units: "3,481세대", lat: 37.6435, lng: 127.0652, district: "노원구", dong: "중계동" },
  { name: "상계주공7단지", addr: "서울 노원구 동일로 1421", units: "2,634세대", lat: 37.6565, lng: 127.0612, district: "노원구", dong: "상계동" },

  // 구로구
  { name: "신도림디큐브시티", addr: "서울 구로구 경인로 662", units: "524세대", lat: 37.5092, lng: 126.8895, district: "구로구", dong: "신도림동" },
  { name: "신도림e편한세상4차", addr: "서울 구로구 신도림로 56", units: "853세대", lat: 37.5075, lng: 126.8845, district: "구로구", dong: "신도림동" },
  { name: "개봉푸르지오", addr: "서울 구로구 개봉로3길 99", units: "978세대", lat: 37.4912, lng: 126.8495, district: "구로구", dong: "개봉동" },
  { name: "개봉한신", addr: "서울 구로구 개봉로20길 6", units: "560세대", lat: 37.4935, lng: 126.8452, district: "구로구", dong: "개봉동" },

  // 은평구
  { name: "북한산푸르지오", addr: "서울 은평구 통일로 684", units: "1,230세대", lat: 37.6085, lng: 126.9325, district: "은평구", dong: "녹번동" },
  { name: "녹번역e편한세상캐슬", addr: "서울 은평구 은평로 220", units: "2,569세대", lat: 37.6012, lng: 126.9312, district: "은평구", dong: "응암동" },
  { name: "은평뉴타운제각말", addr: "서울 은평구 진관4로 77", units: "1,532세대", lat: 37.6355, lng: 126.9245, district: "은평구", dong: "진관동" },

  // 강동구
  { name: "고덕그라시움", addr: "서울 강동구 고덕로 333", units: "4,932세대", lat: 37.5565, lng: 127.1585, district: "강동구", dong: "고덕동" },
  { name: "고덕아르테온", addr: "서울 강동구 고덕로 360", units: "4,066세대", lat: 37.5542, lng: 127.1652, district: "강동구", dong: "상일동" },
  { name: "올림픽파크포레온", addr: "서울 강동구 양재대로 1340", units: "12,032세대", lat: 37.5215, lng: 127.1352, district: "강동구", dong: "둔촌동" },

  // 양천구
  { name: "목동신시가지7단지", addr: "서울 양천구 목동서로 225", units: "2,550세대", lat: 37.5275, lng: 126.8652, district: "양천구", dong: "목동" },
  { name: "목동하이페리온", addr: "서울 양천구 목동동로 257", units: "466세대", lat: 37.5255, lng: 126.8745, district: "양천구", dong: "목동" },
  { name: "목동센트럴푸르지오", addr: "서울 양천구 오목로 299", units: "248세대", lat: 37.5242, lng: 126.8692, district: "양천구", dong: "목동" },
];

// 대표 동네별 기본 기준 좌표
export const NEIGHBORHOOD_DEFAULT_COORDS: Record<string, { lat: number; lng: number }> = {
  송파동: { lat: 37.5047, lng: 127.1183 },
  송파삼성래미안: { lat: 37.5047, lng: 127.1183 },
  신천동: { lat: 37.5205, lng: 127.1062 },
  잠실동: { lat: 37.5135, lng: 127.0865 },
  가락동: { lat: 37.4982, lng: 127.1186 },
  문정동: { lat: 37.4935, lng: 127.1142 },
  위례: { lat: 37.4772, lng: 127.1437 },
  당산동: { lat: 37.5348, lng: 126.9035 },
  "당산 2동": { lat: 37.5351, lng: 126.9028 },
  문래동: { lat: 37.5185, lng: 126.8965 },
  공릉동: { lat: 37.6258, lng: 127.0735 },
  공릉: { lat: 37.6257, lng: 127.0731 },
  개봉동: { lat: 37.4935, lng: 126.8452 },
  대치동: { lat: 37.4952, lng: 127.0612 },
  반포동: { lat: 37.5032, lng: 127.0125 },
  아현동: { lat: 37.5548, lng: 126.9535 },
  상계동: { lat: 37.6565, lng: 127.0612 },
  목동: { lat: 37.5275, lng: 126.8652 },
  고덕동: { lat: 37.5565, lng: 127.1585 },
};

/**
 * 두 좌표 사이의 구면 거리(미터) 계산 (Haversine 공식)
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 특정 위도/경도 기준 가장 가까운 아파트 단지 목록 반환 (거리순)
 */
export function findNearbyApartments(
  userLat: number,
  userLng: number,
  limit = 7,
): NearbyApartment[] {
  return SEOUL_APARTMENT_DB.map((apt) => {
    const meters = calculateDistanceMeters(userLat, userLng, apt.lat, apt.lng);
    const dist = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
    return {
      ...apt,
      dist,
      distMeters: meters,
    };
  })
    .sort((a, b) => a.distMeters - b.distMeters)
    .slice(0, limit);
}

/**
 * 아파트 이름 또는 주소 키워드로 아파트 검색
 */
export function searchApartments(query: string, limit = 10): NearbyApartment[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEOUL_APARTMENT_DB.filter(
    (apt) =>
      apt.name.toLowerCase().includes(q) ||
      apt.addr.toLowerCase().includes(q) ||
      apt.district.includes(q) ||
      apt.dong.includes(q),
  )
    .map((apt) => ({
      ...apt,
      dist: "",
      distMeters: 0,
    }))
    .slice(0, limit);
}
