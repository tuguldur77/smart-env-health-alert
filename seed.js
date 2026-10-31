import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const rawDataSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  pm10: { type: Number },
  pm25: { type: Number },
  temperature: { type: Number },
  humidity: { type: Number },
  windSpeed: { type: Number }
});

const RawEnvironmentData = mongoose.model('RawEnvironmentData', rawDataSchema);

const HourlyEnvironmentData = mongoose.model('HourlyEnvironmentData', new mongoose.Schema({
  hour: { type: Date, required: true, index: true },
  avgTemperature: { type: Number },
  avgHumidity: { type: Number },
  avgWind: { type: Number },
  avgPm10: { type: Number },
  avgPm25: { type: Number }
}));

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await RawEnvironmentData.deleteMany({});
    console.log('Cleared existing data');

    // Generate test data for last 12 hours
    const now = new Date();
    const testData = [];
    const baseLat = 37.5665;
    const baseLon = 126.978;

    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Every hour ago
      testData.push({
        timestamp,
        location: {
          latitude: baseLat + (Math.random() - 0.5) * 0.01, // Slight variation
          longitude: baseLon + (Math.random() - 0.5) * 0.01
        },
        pm10: Math.floor(Math.random() * 50) + 10, // 10-60
        pm25: Math.floor(Math.random() * 30) + 5,  // 5-35
        temperature: Math.floor(Math.random() * 10) + 15, // 15-25°C
        humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
        windSpeed: Math.floor(Math.random() * 5) + 1 // 1-6 m/s
      });
    }

    await RawEnvironmentData.insertMany(testData);
    console.log('Inserted test data');

    // Also insert hourly data
    const hourlyData = [];
    for (let i = 0; i < 12; i++) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      hourlyData.push({
        hour,
        avgTemperature: Math.floor(Math.random() * 10) + 15,
        avgHumidity: Math.floor(Math.random() * 30) + 50,
        avgWind: Math.floor(Math.random() * 5) + 1,
        avgPm10: Math.floor(Math.random() * 50) + 10,
        avgPm25: Math.floor(Math.random() * 30) + 5
      });
    }
    await HourlyEnvironmentData.insertMany(hourlyData);
    console.log('Inserted hourly test data');

    console.log('Seeding completed');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedData();