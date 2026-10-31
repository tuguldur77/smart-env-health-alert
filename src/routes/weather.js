import express from "express";
import { getWeatherData } from "../services/weatherService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const latRaw = req.query.lat;
    const lonRaw = req.query.lon;
    const lat = latRaw !== undefined ? Number(latRaw) : undefined;
    const lon = lonRaw !== undefined ? Number(lonRaw) : undefined;

    const data = await getWeatherData(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Weather API fetch failed" });
  }
});

export default router;