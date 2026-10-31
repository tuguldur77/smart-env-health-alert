import mongoose from 'mongoose';

const hourlyEnvironmentDataSchema = new mongoose.Schema({
  hour: { type: Date, required: true, index: true },
  avgTemperature: { type: Number },
  avgHumidity: { type: Number },
  avgWind: { type: Number },
  avgPm10: { type: Number },
  avgPm25: { type: Number }
});

export default mongoose.model('HourlyEnvironmentData', hourlyEnvironmentDataSchema);