import axios from "axios";

export async function getWeatherData(lat = 37.5665, lon = 126.978) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  const params = {
    latitude: hasCoords ? latitude : 37.5665,
    longitude: hasCoords ? longitude : 126.978,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation",
    hourly: "precipitation_probability"
  };

  try {
    const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", { params });
    const current = data?.current ?? {};
    const hourly = data?.hourly ?? {};

    const precipProb = Array.isArray(hourly.precipitation_probability)
      ? hourly.precipitation_probability[0]
      : null;

    const weather = {
      city: "Seoul",
      latitude: params.latitude,
      longitude: params.longitude,
      temperature: current.temperature_2m ?? null,
      humidity: current.relative_humidity_2m ?? null,
      feelsLike: current.apparent_temperature ?? null,
      weatherCode: current.weather_code ?? null,
      wind: current.wind_speed_10m ?? null,
      precipitation: current.precipitation ?? null,
      precipitationProbability: precipProb ?? null
    };

    console.log("✅ Open-Meteo Weather Data:", weather);
    return weather;
  } catch (error) {
    console.error("❌ Open-Meteo API Error:", error.message);
    return { error: "Weather API fetch failed" };
  }
}
