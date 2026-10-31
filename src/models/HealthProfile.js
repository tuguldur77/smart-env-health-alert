import mongoose from 'mongoose';

const healthProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // 기본 정보
  ageGroup: { type: String, enum: ['0-6', '7-12', '13-18', '19-64', '65+'], required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },

  // 건강 상태
  chronicConditions: [{
    type: String,
    enum: [
      'asthma',
      'copd',
      'allergy',
      'heart',
      'diabetes',
      'other',
      'none',
      'heatwave',    // <-- added
      'coldwave',    // <-- added
      'heat_wave',   // <-- added (backend original format)
      'cold_wave'    // <-- added
    ]
  }],

  respiratorySensitivity: { type: String, enum: ['very_sensitive', 'sensitive', 'normal', 'low'], default: 'normal' },

  // 생활 패턴
  activityTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'irregular'], default: 'irregular' },
  outdoorActivityHours: { type: String, enum: ['<1', '1-3', '3-5', '5+'], default: '1-3' },
  workEnvironment: { type: String, enum: ['indoor', 'mixed', 'outdoor'], default: 'mixed' },

  // 환경 민감도
  pmSensitivity: { type: String, enum: ['very_sensitive', 'sensitive', 'normal', 'low'], default: 'normal' },
  weatherSensitivity: { type: String, enum: ['very_sensitive', 'sensitive', 'normal', 'low'], default: 'normal' },
  disasterSensitivity: { type: String, enum: ['very_sensitive', 'sensitive', 'normal', 'low'], default: 'normal' },

  // 행동 패턴
  maskUsage: { type: String, enum: ['always', 'usually', 'sometimes', 'never'], default: 'sometimes' },
  airPurifierUsage: { type: String, enum: ['always', 'often', 'rarely', 'none'], default: 'rarely' },

  // 알림 설정
  alertSituations: [{
    type: String,
    enum: [
      'pm10_bad',
      'pm25_bad',
      'ozone_high',
      'heatwave',     // <-- added
      'coldwave',     // <-- added
      'heat_wave',    // <-- backend original
      'cold_wave',    // <-- backend original
      'temp_change',
      'air_improvement',
      'personal_risk'
    ]
  }],

  alertTimePreference: { type: String, enum: ['anytime', 'morning', 'before_outing', 'no_night'], default: 'anytime' },

  // 응급 연락
  emergencyContact: {
    enabled: { type: Boolean, default: false },
    name: { type: String },
    phone: { type: String }
  },

  // 계산된 값
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'medium' },
  environmentSensitivityScore: { type: Number, default: 0 },
  heatSensitivityScore: { type: Number, default: 0 },
  respiratoryRiskScore: { type: Number, default: 0 },

  recommendedAlertThresholds: {
    pm10: { type: Number, default: 50 },
    pm25: { type: Number, default: 25 },
    tempHigh: { type: Number, default: 30 },
    tempLow: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('HealthProfile', healthProfileSchema);
