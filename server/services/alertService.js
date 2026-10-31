import { getWeatherData } from "./weatherService.js";
import { getAirData, getNearestDistrict, calcAirGrade } from "./airService.js";

export async function getAlertMessage(lat = null, lon = null, profile = null) {
  try {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const hasCoords = Number.isFinite(latNum) && Number.isFinite(lonNum);

    const [weather, airPayload] = await Promise.all([
      getWeatherData(latNum, lonNum),
      getAirData()
    ]);

    const temp = weather?.temperature ?? null;
    const feels = weather?.feelsLike ?? null;
    const humidity = weather?.humidity ?? null;
    const wind = weather?.wind ?? null;

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
    const pm25Value = Number.isFinite(pm25) ? pm25 : null;

    // Default alert for non-personalized users
    let alert = `${district}의 오늘은 쾌적한 날씨입니다 😊`;
    let alerts = [alert];

    // Personalized alerts if profile exists
    if (profile && profile.riskLevel) {
      alerts = [];
      const riskLevel = profile.riskLevel;

      // ========== ① 기본 위험도 ==========
      if (riskLevel === "very_high") {
        alerts.push("현재 건강 취약도가 매우 높아 환경 변화에 각별한 주의가 필요합니다.");
      } else if (riskLevel === "high") {
        alerts.push("현재 건강 취약도가 높습니다. 외출 또는 실외 활동 시 주의하세요.");
      } else if (riskLevel === "medium") {
        alerts.push("건강 취약도는 보통 수준입니다. 기상 상황에 따라 컨디션 변화가 있을 수 있습니다.");
      }

      // ========== ② 미세먼지 기반 위험 ==========
      if (pm25Value > 35 || pm10Value > 80) {
        if (profile.chronicConditions?.includes("asthma") || profile.respiratorySensitivity !== "low") {
          alerts.push(`초미세먼지(${pm25Value})와 미세먼지(${pm10Value}) 수치가 높습니다. 마스크 착용을 강하게 권장합니다.`);
        } else {
          alerts.push(`현재 미세먼지 수치가 좋지 않습니다. 가능한 실내 활동을 권장합니다.`);
        }
      } else if (pm25Value > 15 || pm10Value > 30) {
        alerts.push(`미세먼지가 보통 수준이지만 민감군은 주의가 필요합니다.`);
      }

      // ========== ③ 기온/체감온도 기반 ==========
      if (temp >= 33) {
        if (riskLevel === "very_high" || profile.weatherSensitivity !== "low") {
          alerts.push(`폭염 수준입니다. 수분 섭취를 늘리고, 가급적 외출을 삼가세요.`);
        } else {
          alerts.push(`더운 날씨입니다. 무리한 활동은 피해주세요.`);
        }
      }

      if (temp <= 0 || feels <= -5) {
        if (profile.ageGroup === "65+" || profile.weatherSensitivity === "very_high") {
          alerts.push(`한파 위험! 고령자는 저체온증 위험이 있으니 외출을 최소화하세요.`);
        } else {
          alerts.push(`추운 날씨입니다. 외투와 장갑 등 보온을 유지하세요.`);
        }
      }

      // ========== ④ 습도/강수/풍속 ==========
      if (humidity >= 80 && riskLevel === "high") {
        alerts.push(`습도가 높아 호흡기 증상이 악화될 수 있습니다.`);
      }

      if (wind >= 10) {
        alerts.push(`바람이 강해 체감온도가 낮아질 수 있습니다.`);
      }

      // ========== ⑤ 활동 패턴 기반 ==========
      const outdoorHours = profile.outdoorActivityHours;
      const outdoorHoursNum = outdoorHours === '5+' ? 5 : outdoorHours === '3-5' ? 4 : outdoorHours === '1-3' ? 2 : 1;
      if (outdoorHoursNum >= 3 && (pm25Value > 20 || temp > 30 || temp < 0)) {
        alerts.push("실외 활동 시간이 긴 편이므로 오늘은 외부 환경에 더 주의해야 합니다.");
      }

      // ========== ⑥ 행동 습관 ==========
      if (profile.maskUsage === "never" && pm25Value > 20) {
        alerts.push("평소 마스크 착용이 적은 편입니다. 오늘은 반드시 마스크를 착용하세요!");
      }

      if (profile.airPurifierUsage === "none" && pm25Value > 20) {
        alerts.push("공기청정기 사용이 거의 없는데, 오늘은 실내 공기질 관리가 중요합니다.");
      }

      // ========== ⑦ 알림 선호도 기반 ==========
      if (profile.alertSituations?.includes("personal_risk")) {
        alerts.push(`현재 나의 위험도: ${riskLevel.toUpperCase()} 단계`);
      }

      // If no specific alerts, use default
      if (alerts.length === 0) {
        alerts.push(`${district}의 오늘은 쾌적한 날씨입니다 😊`);
      }
    }

    return {
      city: "서울시",
      district,
      temperature: temp,
      feelsLike: feels,
      humidity,
      wind,
      pm10: pm10Value,
      pm25: pm25Value,
      grade,
      alerts,
      alert: alerts.join(' ')
    };
  } catch (error) {
    console.error("❌ Alert generation failed:", error.message);
    return { error: "AlertService Error" };
  }
}
