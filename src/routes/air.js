import express from "express";
import {
  getAirData,
  getNearestDistrict,
  calcAirGrade,
  districtCoords,
  stationNameMap
} from "../services/airService.js";

const router = express.Router();

// Log all incoming air routes
router.use((req, res, next) => {
  console.log(`🛤️ Air route hit: ${req.method} ${req.url}`);
  next();
});

// ====================================================
// 1. TEST ROUTE
// ====================================================
router.get("/test", (req, res) => {
  console.log("🧪 /api/air/test called");
  res.json({
    message: "Air test route works",
    districts: Object.keys(districtCoords),
  });
});

// ====================================================
// 2. DISTRICTS TEST ROUTE (with simulated values)
// ====================================================
router.get("/districts-test", async (req, res) => {
  console.log("📍 /api/air/districts-test called");

  try {
    const airData = await getAirData();
    const districtsData = airData.airData || [];

    console.log(`📍 Found ${districtsData.length} districts from API`);

    const allDistricts = Object.keys(districtCoords).filter(
      (name) => name !== "서울시"
    );

    const districtsWithData = allDistricts.map((districtName) => {
      // Try direct match first (service now normalizes to district names when possible)
      let realData = districtsData.find((d) => d.district === districtName);

      // Fallback: match by station alias list
      if (!realData) {
        const aliases = (stationNameMap[districtName] || [districtName]).map((s) => s.replace(/\s+/g, ""));
        realData = districtsData.find((d) => aliases.includes((d.district || "").replace(/\s+/g, "")));
      }

      if (realData) {
        return {
          ...realData,
          coordinates: districtCoords[districtName],
          simulated: false,
        };
      }

      // simulate if missing
      const basePm10 = airData.pm10 || 30;
      const basePm25 = airData.pm25 || 15;

      const variation = 0.2;
      const pm10 = Math.round(
        basePm10 * (1 + (Math.random() - 0.5) * variation)
      );
      const pm25 = Math.round(
        basePm25 * (1 + (Math.random() - 0.5) * variation)
      );

      return {
        district: districtName,
        pm10: Math.max(0, pm10),
        pm25: Math.max(0, pm25),
        grade: calcAirGrade(pm10, pm25) || "보통",
        time: airData.updated || new Date().toISOString(),
        coordinates: districtCoords[districtName],
        simulated: true,
      };
    });

    res.json({
      city: "서울시",
      districts: districtsWithData,
      updated: airData.updated,
      totalDistricts: districtsWithData.length,
    });
  } catch (err) {
    console.error("❌ /districts-test ERROR:", err);
    res.status(500).json({
      error: "Air districts-test failed",
      details: err.message,
    });
  }
});

// ====================================================
// 3. MAIN DISTRICTS ROUTE (real + simulated mix)
// ====================================================
router.get("/districts", async (req, res) => {
  console.log("📍 /api/air/districts called");

  try {
    const airData = await getAirData();
    const districtsData = airData.airData || [];

    const allDistricts = Object.keys(districtCoords).filter(
      (name) => name !== "서울시"
    );

    const districtsWithData = allDistricts.map((districtName) => {
      // Try direct match first
      let realData = districtsData.find((d) => d.district === districtName);
      if (!realData) {
        const aliases = (stationNameMap[districtName] || [districtName]).map((s) => s.replace(/\s+/g, ""));
        realData = districtsData.find((d) => aliases.includes((d.district || "").replace(/\s+/g, "")));
      }

      if (realData) {
        return {
          ...realData,
          coordinates: districtCoords[districtName],
          simulated: false,
        };
      }

      // simulate if missing
      const basePm10 = airData.pm10 || 30;
      const basePm25 = airData.pm25 || 15;

      const variation = 0.2;
      const pm10 = Math.round(
        basePm10 * (1 + (Math.random() - 0.5) * variation)
      );
      const pm25 = Math.round(
        basePm25 * (1 + (Math.random() - 0.5) * variation)
      );

      return {
        district: districtName,
        pm10: Math.max(0, pm10),
        pm25: Math.max(0, pm25),
        grade: calcAirGrade(pm10, pm25) || "보통",
        time: airData.updated || new Date().toISOString(),
        coordinates: districtCoords[districtName],
        simulated: true,
      };
    });

    res.json({
      city: "서울시",
      districts: districtsWithData,
      updated: airData.updated,
      totalDistricts: districtsWithData.length,
    });
  } catch (err) {
    console.error("❌ /districts ERROR:", err);
    res.status(500).json({
      error: "Air districts fetch failed",
      details: err.message,
    });
  }
});

// ====================================================
// 4. DEFAULT SINGLE DISTRICT / NEAREST DISTRICT
// ====================================================
router.get("/", async (req, res) => {
  try {
    const airData = await getAirData();
    const { lat, lon } = req.query;

    if (lat !== undefined && lon !== undefined) {
      const latNum = Number(lat);
      const lonNum = Number(lon);

      console.log(
        `📍 Received coords lat=${latNum}, lon=${lonNum} for district lookup`
      );

      const nearest = getNearestDistrict(latNum, lonNum);
      const districtData = airData.airData?.find(
        (d) => d.district === nearest
      );

      if (!districtData) {
        return res.json({
          city: "서울시",
          district: nearest ?? "-",
          pm10: airData.pm10,
          pm25: airData.pm25,
          grade:
            airData.grade ||
            calcAirGrade(airData.pm10, airData.pm25) ||
            "-",
          msg: "No district match",
        });
      }

      return res.json({
        city: "서울시",
        district: nearest,
        pm10: districtData.pm10,
        pm25: districtData.pm25,
        grade:
          districtData.grade ||
          calcAirGrade(districtData.pm10, districtData.pm25) ||
          "-",
        updated: districtData.time ?? airData.updated,
      });
    }

    // Fallback (no location provided)
    res.json({
      city: airData.city,
      pm10: airData.pm10,
      pm25: airData.pm25,
      grade:
        airData.grade || calcAirGrade(airData.pm10, airData.pm25) || "-",
      updated: airData.updated,
    });
  } catch (err) {
    console.error("❌ Air root route error:", err);
    res.status(500).json({ error: "Air data fetch failed" });
  }
});

export default router;
