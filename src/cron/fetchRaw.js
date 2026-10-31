import { getWeatherData } from '../services/weatherService.js';
import { getAirData } from '../services/airService.js';
import RawEnvironmentData from '../models/RawEnvironmentData.js';

export const fetchRawData = async () => {
  try {
    const [weather, air] = await Promise.all([
      getWeatherData(),
      getAirData()
    ]);

    const rawData = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      wind: weather.wind,
      pm10: air.pm10,
      pm25: air.pm25
    };

    await RawEnvironmentData.create(rawData);
    console.log('✅ Raw data fetched and stored');
  } catch (error) {
    console.error('❌ Failed to fetch raw data:', error.message);
  }
};

// Lambda handler
export const handler = async (event) => {
  try {
    await fetchRawData();
    return { statusCode: 200, body: JSON.stringify({ message: 'Raw data fetched successfully' }) };
  } catch (error) {
    console.error('Error in fetchRaw Lambda:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch raw data' }) };
  }
};