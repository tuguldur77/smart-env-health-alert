import RawEnvironmentData from '../models/RawEnvironmentData.js';
import HourlyEnvironmentData from '../models/HourlyEnvironmentData.js';

export const aggregateHourlyData = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const rawData = await RawEnvironmentData.find({ timestamp: { $gte: oneHourAgo } });

    if (rawData.length === 0) return;

    const avgData = {
      hour: new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000), // Start of current hour
      avgTemperature: rawData.reduce((sum, d) => sum + (d.temperature || 0), 0) / rawData.length,
      avgHumidity: rawData.reduce((sum, d) => sum + (d.humidity || 0), 0) / rawData.length,
      avgWind: rawData.reduce((sum, d) => sum + (d.wind || 0), 0) / rawData.length,
      avgPm10: rawData.reduce((sum, d) => sum + (d.pm10 || 0), 0) / rawData.length,
      avgPm25: rawData.reduce((sum, d) => sum + (d.pm25 || 0), 0) / rawData.length
    };

    await HourlyEnvironmentData.create(avgData);
    console.log('✅ Hourly data aggregated and stored');
  } catch (error) {
    console.error('❌ Failed to aggregate hourly data:', error.message);
  }
};

// Lambda handler
export const handler = async (event) => {
  try {
    await aggregateHourlyData();
    return { statusCode: 200, body: JSON.stringify({ message: 'Hourly data aggregated successfully' }) };
  } catch (error) {
    console.error('Error in aggregateHourly Lambda:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to aggregate hourly data' }) };
  }
};