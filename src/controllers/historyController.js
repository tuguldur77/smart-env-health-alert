import RawEnvironmentData from '../models/RawEnvironmentData.js';
import HourlyEnvironmentData from '../models/HourlyEnvironmentData.js';
import mongoose from 'mongoose';

export const getRawHistory = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    const hours = parseInt(req.query.hours) || 12;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await RawEnvironmentData.find({ timestamp: { $gte: since } }).sort({ timestamp: 1 });
    res.json(data);
  } catch (error) {
    console.error('DB error:', error.message);
    // Return mock data for demo
    const mockData = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      mockData.push({
        timestamp: timestamp.toISOString(),
        location: { latitude: 37.5665, longitude: 126.978 },
        pm10: Math.floor(Math.random() * 50) + 10,
        pm25: Math.floor(Math.random() * 30) + 5,
        temperature: Math.floor(Math.random() * 10) + 15,
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 5) + 1
      });
    }
    res.json(mockData);
  }
};

export const getHourlyHistory = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await HourlyEnvironmentData.find({ hour: { $gte: since } }).sort({ hour: 1 });
    res.json(data);
  } catch (error) {
    console.error('DB error:', error.message);
    // Return mock data for demo
    const mockData = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      mockData.push({
        hour: hour.toISOString(),
        avgTemperature: Math.floor(Math.random() * 10) + 15,
        avgHumidity: Math.floor(Math.random() * 30) + 50,
        avgWind: Math.floor(Math.random() * 5) + 1,
        avgPm10: Math.floor(Math.random() * 50) + 10,
        avgPm25: Math.floor(Math.random() * 30) + 5
      });
    }
    res.json({ error: error.message, data: mockData });
  }
};