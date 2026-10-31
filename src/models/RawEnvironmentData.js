import mongoose from 'mongoose';

const rawEnvironmentDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  temperature: { type: Number },
  humidity: { type: Number },
  wind: { type: Number },
  pm10: { type: Number },
  pm25: { type: Number }
});

// TTL index for 12 hours
rawEnvironmentDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 12 });

export default mongoose.model('RawEnvironmentData', rawEnvironmentDataSchema);