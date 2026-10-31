export function evaluateRiskLevel(profile) {
  if (!profile) {
    throw new Error('Profile data is required');
  }

  let score = 0;

  // 1. 연령
  if (profile.ageGroup === '0-6') score += 3;      // 영유아
  else if (profile.ageGroup === '65+') score += 3; // 고령자
  else if (profile.ageGroup === '13-18') score += 1;
  else score += 0; // 19–64 기본

  // 2. 만성 질환
  const diseases = profile.chronicConditions || [];
  const hasResp = diseases.includes('asthma') || diseases.includes('copd') || diseases.includes('allergy');
  const hasCardio = diseases.includes('heart');
  const hasOther = diseases.includes('diabetes') || diseases.includes('other');

  if (hasResp) score += 3;
  if (hasCardio) score += 2;
  if (hasOther) score += 1;

  // 3. 민감도
  const sensMap = { very_sensitive: 3, sensitive: 2, normal: 1, low: 0 };

  score += sensMap[profile.respiratorySensitivity] ?? 1; // default to normal
  score += sensMap[profile.weatherSensitivity] ?? 1;
  score += sensMap[profile.disasterSensitivity] ?? 1;

  // 4. 생활 패턴 (실외 활동 많 + 실외 환경이면 가산)
  const outdoorHours = profile.outdoorActivityHours;
  let outdoorScore = 0;
  if (outdoorHours === '5+') outdoorScore = 3;
  else if (outdoorHours === '3-5') outdoorScore = 2;
  else if (outdoorHours === '1-3') outdoorScore = 1;
  score += outdoorScore;

  if (profile.workEnvironment === 'outdoor') score += 2;
  else if (profile.workEnvironment === 'mixed') score += 1;

  // 5. 보호 행동(마스크, 공기청정기)은 점수 감소
  if (profile.maskUsage === 'always') score -= 2;
  else if (profile.maskUsage === 'usually') score -= 1;

  if (profile.airPurifierUsage === 'always') score -= 2;
  else if (profile.airPurifierUsage === 'often') score -= 1;

  // 하한/상한 클램프
  if (score < 0) score = 0;
  if (score > 20) score = 20;

  // 6. 점수 → 레벨 매핑
  let riskLevel = 'low';
  if (score >= 15) riskLevel = 'very_high';
  else if (score >= 10) riskLevel = 'high';
  else if (score >= 5) riskLevel = 'medium';

  // Additional scores for other metrics (keep some from previous implementation)
  let environmentSensitivityScore = 0;
  let heatSensitivityScore = 0;
  let respiratoryRiskScore = 0;

  // Environment sensitivity based on PM and outdoor factors
  environmentSensitivityScore += sensMap[profile.pmSensitivity] * 10;
  environmentSensitivityScore += outdoorScore * 5;
  environmentSensitivityScore = Math.min(100, environmentSensitivityScore);

  // Heat sensitivity
  heatSensitivityScore += sensMap[profile.weatherSensitivity] * 15;
  heatSensitivityScore += sensMap[profile.disasterSensitivity] * 10;
  if (hasCardio || hasOther) heatSensitivityScore += 20;
  heatSensitivityScore = Math.min(100, heatSensitivityScore);

  // Respiratory risk
  respiratoryRiskScore += sensMap[profile.respiratorySensitivity] * 15;
  if (hasResp) respiratoryRiskScore += 30;
  respiratoryRiskScore += outdoorScore * 5;
  respiratoryRiskScore = Math.min(100, respiratoryRiskScore);

  // Recommended thresholds
  const thresholds = {
    pm10: 50,
    pm25: 25,
    tempHigh: 30,
    tempLow: 0
  };

  if (profile.pmSensitivity === 'very_sensitive') {
    thresholds.pm10 = 30;
    thresholds.pm25 = 15;
  } else if (profile.pmSensitivity === 'sensitive') {
    thresholds.pm10 = 40;
    thresholds.pm25 = 20;
  }

  if (profile.weatherSensitivity === 'very_sensitive') {
    thresholds.tempHigh = 25;
    thresholds.tempLow = 5;
  } else if (profile.weatherSensitivity === 'sensitive') {
    thresholds.tempHigh = 27;
    thresholds.tempLow = 3;
  }

  return {
    riskLevel,
    environmentSensitivityScore,
    heatSensitivityScore,
    respiratoryRiskScore,
    recommendedAlertThresholds: thresholds
  };
}