import express from "express";
import { getAirData, getNearestDistrict, calcAirGrade, districtCoords } from "../services/airService.js";

const router = express.Router();

// Middleware to log all requests to air routes
router.use((req, res, next) => {
  console.log(`🛤️  Air route: ${req.method} ${req.url}`);
  next();
});

// Test route for districts
router.get("/test", (req, res) => {
  console.log("🧪 Test route called");
  res.json({ message: "Air test route works", districts: Object.keys(districtCoords) });
});

// New route for all districts data
router.get("/districts-test", async (req, res) => {
  console.log("📍 Districts test route called at", new Date().toISOString());
  console.log("📍 Request URL:", req.url);
  console.log("📍 Request method:", req.method);
  try {
    const airData = await getAirData();
    const districtsData = airData.airData || [];

    console.log(`📍 Found ${districtsData.length} districts in airData`);

    // Create data for all Seoul districts
    const allDistricts = Object.keys(districtCoords).filter(name => name !== "서울시");
    console.log(`📍 All districts count: ${allDistricts.length}`);
    const districtsWithData = allDistricts.map(districtName => {
      // Try to find real data first
      const realData = districtsData.find(d => d.district === districtName);
      if (realData) {
        return {
          ...realData,
          coordinates: districtCoords[districtName]
        };
      }

      // Generate simulated data based on city average with some variation
      const basePm10 = airData.pm10 || 30;
      const basePm25 = airData.pm25 || 15;
      
      // Add some random variation (±20%)
      const variation = 0.2;
      const pm10 = Math.round(basePm10 * (1 + (Math.random() - 0.5) * variation));
      const pm25 = Math.round(basePm25 * (1 + (Math.random() - 0.5) * variation));
      
      return {
        district: districtName,
        pm10: Math.max(0, pm10),
        pm25: Math.max(0, pm25),
        grade: calcAirGrade(pm10, pm25) || "보통",
        time: airData.updated || new Date().toISOString(),
        coordinates: districtCoords[districtName],
        simulated: true // Mark as simulated data
      };
    });

    console.log(`📍 Returning ${districtsWithData.length} districts`);
    res.json({
      city: "서울시",
      districts: districtsWithData,
      updated: airData.updated || new Date().toISOString(),
      totalDistricts: districtsWithData.length
    });
  } catch (err) {
    console.error("❌ Air districts route error:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Air districts data fetch failed", details: err.message });
  }
});

// New route for all districts data
router.get("/districts", async (req, res) => {
  console.log("📍 Districts route called at", new Date().toISOString());
  console.log("📍 Request URL:", req.url);
  console.log("📍 Request method:", req.method);
  try {
    const airData = await getAirData();
    const districtsData = airData.airData || [];

    console.log(`📍 Found ${districtsData.length} districts in airData`);

    // Create data for all Seoul districts
    const allDistricts = Object.keys(districtCoords).filter(name => name !== "서울시");
    console.log(`📍 All districts count: ${allDistricts.length}`);
    const districtsWithData = allDistricts.map(districtName => {
      // Try to find real data first
      const realData = districtsData.find(d => d.district === districtName);
      if (realData) {
        return {
          ...realData,
          coordinates: districtCoords[districtName]
        };
      }

      // Generate simulated data based on city average with some variation
      const basePm10 = airData.pm10 || 30;
      const basePm25 = airData.pm25 || 15;
      
      // Add some random variation (±20%)
      const variation = 0.2;
      const pm10 = Math.round(basePm10 * (1 + (Math.random() - 0.5) * variation));
      const pm25 = Math.round(basePm25 * (1 + (Math.random() - 0.5) * variation));
      
      return {
        district: districtName,
        pm10: Math.max(0, pm10),
        pm25: Math.max(0, pm25),
        grade: calcAirGrade(pm10, pm25) || "보통",
        time: airData.updated || new Date().toISOString(),
        coordinates: districtCoords[districtName],
        simulated: true // Mark as simulated data
      };
    });

    console.log(`📍 Returning ${districtsWithData.length} districts`);
    res.json({
      city: "서울시",
      districts: districtsWithData,
      updated: airData.updated || new Date().toISOString(),
      totalDistricts: districtsWithData.length
    });
  } catch (err) {
    console.error("❌ Air districts route error:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Air districts data fetch failed", details: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const airData = await getAirData();
    const { lat, lon } = req.query;

    if (lat !== undefined && lon !== undefined) {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      const nearest = getNearestDistrict(latNum, lonNum);
      const districtData = airData.airData?.find?.((d) => d.district === nearest);

      if (!districtData) {
        return res.json({
          city: "서울시",
          district: nearest ?? "-",
          pm10: airData.pm10,
          pm25: airData.pm25,
          grade: airData.grade ?? calcAirGrade(airData.pm10, airData.pm25) ?? "-",
          msg: "No district match"
        });
      }

      return res.json({
        city: "서울시",
        district: nearest,
        pm10: districtData.pm10,
        pm25: districtData.pm25,
        grade: districtData.grade ?? calcAirGrade(districtData.pm10, districtData.pm25) ?? "-",
        updated: districtData.time ?? airData.updated ?? null
      });
    }

    // fallback (no GPS)
    res.json({
      city: airData.city,
      pm10: airData.pm10,
      pm25: airData.pm25,
      grade: airData.grade ?? calcAirGrade(airData.pm10, airData.pm25) ?? "-",
      updated: airData.updated ?? null
    });
  } catch (err) {
    console.error("❌ Air route error:", err.message);
    res.status(500).json({ error: "Air data fetch failed" });
  }
});

export default router;
