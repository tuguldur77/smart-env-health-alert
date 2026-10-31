import { getWeatherData } from "./weatherService.js";
import { getAirData, getNearestDistrict, calcAirGrade } from "./airService.js";
import { evaluateRiskLevel } from "./riskService.js";
import HealthProfile from "../models/HealthProfile.js";

export async function getAlertMessage(lat = null, lon = null) {
  try {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const hasCoords = Number.isFinite(latNum) && Number.isFinite(lonNum);

    const [weather, airPayload] = await Promise.all([
      getWeatherData(latNum, lonNum),
      getAirData()
    ]);

    const weatherTemp = weather?.temperature ?? null;
    const weatherFeels = weather?.feelsLike ?? null;

    let district = "서울시";
    let pm10 = airPayload?.pm10 ?? null;
    let pm25 = airPayload?.pm25 ?? null;
    let grade = airPayload?.grade ?? null;

    if (hasCoords && Array.isArray(airPayload?.airData) && airPayload.airData.length) {
      const nearest = getNearestDistrict(latNum, lonNum);
      if (nearest) {
        district = nearest;
        const districtData = airPayload.airData.find((d) => d.district === nearest);
        if (districtData) {
          pm10 = districtData.pm10 ?? pm10;
          pm25 = districtData.pm25 ?? pm25;
          grade = districtData.grade ?? grade ?? calcAirGrade(pm10, pm25);
        }
      }
    }

    if (!grade) grade = calcAirGrade(pm10, pm25) ?? "-";

    const pm10Value = Number.isFinite(pm10) ? pm10 : null;

    let alert = `${district}의 오늘은 쾌적한 날씨입니다 😊`;

    if ((typeof grade === "string" && grade.includes("나쁨")) || (pm10Value != null && pm10Value > 50)) {
      alert = `${district}의 미세먼지 ‘나쁨’ 단계입니다. 외출 시 마스크 착용을 권장합니다 😷`;
    } else if (weatherTemp != null && weatherTemp > 30) {
      alert = `${district}은 폭염 주의! 충분한 수분 섭취를 하세요 ☀️`;
    } else if (weatherTemp != null && weatherTemp < 0) {
      alert = `${district}은 한파 주의! 따뜻하게 입으세요 🧣`;
    } else if (weatherFeels != null && weatherFeels < 3) {
      alert = `${district} 체감온도가 낮습니다. 외출 시 보온에 신경 쓰세요 🧥`;
    }

    return {
      city: "서울시",
      district,
      temperature: weatherTemp,
      feelsLike: weatherFeels,
      pm10: pm10Value,
      pm25: Number.isFinite(pm25) ? pm25 : null,
      grade,
      alert
    };
  } catch (error) {
    console.error("❌ Alert generation failed:", error.message);
    return { error: "AlertService Error" };
  }
}

export async function getPersonalAlertMessage(userId, lat = null, lon = null) {
  try {
    const profile = await HealthProfile.findOne({ userId });
    if (!profile) {
      return { error: "Health profile not found" };
    }

    const riskLevel = evaluateRiskLevel(profile);
    const baseAlert = await getAlertMessage(lat, lon);

    if (baseAlert.error) return baseAlert;

    let personalAlert = baseAlert.alert;
    let severity = 'low';

    // Customize based on health profile
    if (profile.hasAsthma && baseAlert.pm25 > 20) {
      personalAlert = `${baseAlert.district}의 미세먼지 수준이 높아 천식에 위험할 수 있습니다. 실내 활동을 권장합니다 🏠`;
      severity = 'high';
    } else if (profile.isElderly && (baseAlert.temperature < 0 || baseAlert.temperature > 30)) {
      personalAlert = `${baseAlert.district}의 기온이 건강에 부담스러울 수 있습니다. 건강 관리에 유의하세요 ⚕️`;
      severity = 'high';
    } else if (profile.isChild && baseAlert.pm10 > 30) {
      personalAlert = `${baseAlert.district}의 대기질이 아동 건강에 해로울 수 있습니다. 외출을 자제하세요 👶`;
      severity = 'high';
    } else if (riskLevel === 'high' && (baseAlert.grade.includes('나쁨') || baseAlert.pm10 > 40)) {
      personalAlert = `${baseAlert.district}의 환경 조건이 건강에 위험할 수 있습니다. 즉시 조치를 취하세요 🚨`;
      severity = 'high';
    }

    return {
      ...baseAlert,
      personalAlert,
      severity,
      riskLevel
    };
  } catch (error) {
    console.error("❌ Personal alert generation failed:", error.message);
    return { error: "PersonalAlertService Error" };
  }
}