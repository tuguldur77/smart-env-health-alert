import axios from "axios";
import xml2js from "xml2js";

const parser = new xml2js.Parser({ explicitArray: false });

const CACHE_TTL_MS = Number(process.env.SEOUL_API_CACHE_MS) || 5 * 60 * 1000;
let cache = null;
let cacheFetchedAt = 0;
let inFlight = null;

export const districtCoords = {
  "강남구": { lat: 37.5173, lon: 127.0473 },
  "강동구": { lat: 37.5301, lon: 127.1238 },
  "강북구": { lat: 37.6396, lon: 127.0257 },
  "강서구": { lat: 37.5509, lon: 126.8495 },
  "관악구": { lat: 37.4784, lon: 126.9516 },
  "광진구": { lat: 37.5384, lon: 127.0822 },
  "구로구": { lat: 37.4954, lon: 126.8874 },
  "금천구": { lat: 37.4569, lon: 126.8957 },
  "노원구": { lat: 37.6542, lon: 127.0568 },
  "도봉구": { lat: 37.6688, lon: 127.0471 },
  "동대문구": { lat: 37.5744, lon: 127.0396 },
  "동작구": { lat: 37.5124, lon: 126.9393 },
  "마포구": { lat: 37.5638, lon: 126.9084 },
  "서대문구": { lat: 37.5791, lon: 126.9368 },
  "서초구": { lat: 37.4836, lon: 127.0326 },
  "성동구": { lat: 37.5635, lon: 127.0369 },
  "성북구": { lat: 37.5894, lon: 127.0167 },
  "송파구": { lat: 37.5117, lon: 127.1065 },
  "양천구": { lat: 37.5169, lon: 126.8664 },
  "영등포구": { lat: 37.5264, lon: 126.8962 },
  "용산구": { lat: 37.5326, lon: 126.9900 },
  "은평구": { lat: 37.6176, lon: 126.9227 },
  "종로구": { lat: 37.5729, lon: 126.9793 },
  "중구": { lat: 37.5636, lon: 126.9978 },
  "중랑구": { lat: 37.6066, lon: 127.0927 },
  "서울시": { lat: 37.5665, lon: 126.9780 }
};

export function getNearestDistrict(lat, lon, coords = districtCoords) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let nearest = null;
  let minDist = Infinity;

  for (const [name, coord] of Object.entries(coords)) {
    const d = Math.hypot(lat - coord.lat, lon - coord.lon);
    if (d < minDist) {
      minDist = d;
      nearest = name;
    }
  }

  return nearest;
}

function calcAirGrade(pm10, pm25) {
  const p10 = Number.isFinite(pm10) ? pm10 : null;
  const p25 = Number.isFinite(pm25) ? pm25 : null;

  if (p10 == null && p25 == null) return null;
  if ((p10 ?? 0) > 80 || (p25 ?? 0) > 35) return "나쁨";
  if ((p10 ?? 0) > 30 || (p25 ?? 0) > 15) return "보통";
  return "좋음";
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildFallbackAirData(timestamp) {
  const districts = Object.keys(districtCoords);
  return districts.map((name, idx) => {
    const pm10 = 22 + idx * 6;
    const pm25 = 11 + idx * 3;
    return {
      district: name,
      pm10,
      pm25,
      ozone: null,
      co: null,
      no2: null,
      so2: null,
      time: timestamp,
      grade: calcAirGrade(pm10, pm25)
    };
  });
}

function finalizeAirPayload(data, fallbackTime) {
  const dataset = data.length ? data : buildFallbackAirData(fallbackTime);

  const validPm10 = dataset.map((d) => d.pm10).filter(Number.isFinite);
  const validPm25 = dataset.map((d) => d.pm25).filter(Number.isFinite);

  const avgPm10 = validPm10.length
    ? Math.round(validPm10.reduce((sum, val) => sum + val, 0) / validPm10.length)
    : null;
  const avgPm25 = validPm25.length
    ? Math.round(validPm25.reduce((sum, val) => sum + val, 0) / validPm25.length)
    : null;

  const grade = calcAirGrade(avgPm10, avgPm25) ?? dataset[0]?.grade ?? "-";

  return {
    city: "서울시",
    count: dataset.length,
    updated: dataset[0]?.time || fallbackTime || "",
    pm10: avgPm10,
    pm25: avgPm25,
    grade,
    airData: dataset,
  };
}

async function fetchAirDataFromSource() {
  const serviceKey = (process.env.SEOUL_API_KEY || "").split(/\s+/)[0].split("//")[0].split("#")[0].trim();
  if (!serviceKey) {
    console.warn("⚠️ Missing SEOUL_API_KEY env value. Using fallback air-quality dataset.");
    return finalizeAirPayload([], new Date().toISOString());
  }

  try {
    const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${serviceKey}&sidoName=서울&ver=1.0`;

    const response = await axios.get(url, { timeout: 15000 });
    const result = await parser.parseStringPromise(response.data);

    const items = result?.response?.body?.items?.item;
    if (!items) {
      console.error("⚠️ No 'items' data found in API response:", result);
      return finalizeAirPayload([], new Date().toISOString());
    }

    const itemsArray = Array.isArray(items) ? items : [items];

    let data = itemsArray
      .map((item) => {
        if (!item) return null;
        const district = (item.stationName?.replace(/\s+측정소$/, '') || item.stationName)?.replace(/\s+/g, '') || item.stationName; // remove spaces and " 측정소" if present
        const pm10 = toNumber(item.pm10Value);
        const pm25 = toNumber(item.pm25Value);

        return {
          district,
          pm10,
          pm25,
          ozone: toNumber(item.o3Value),
          co: toNumber(item.coValue),
          no2: toNumber(item.no2Value),
          so2: toNumber(item.so2Value),
          time: item.dataTime,
          grade: calcAirGrade(pm10, pm25)
        };
      })
      .filter((entry) => entry && entry.district && Object.keys(districtCoords).includes(entry.district));

    return finalizeAirPayload(data, new Date().toISOString());
  } catch (err) {
    if (err.message.includes('timeout')) {
      console.warn("⚠️ Air quality API timeout:", err.message, "- using fallback data");
    } else {
      console.error("❌ Air quality API Error:", err.message);
    }
    return finalizeAirPayload([], new Date().toISOString());
  }
}

export async function getAirData(options = {}) {
  const force = options.force === true;
  const now = Date.now();

  if (!force && cache && now - cacheFetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  if (!force && inFlight) {
    return inFlight;
  }

  inFlight = fetchAirDataFromSource()
    .then((payload) => {
      cache = payload;
      cacheFetchedAt = Date.now();
      return payload;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export { calcAirGrade };
