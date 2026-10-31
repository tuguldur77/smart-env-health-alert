import express from "express";
import mongoose from "mongoose";
import { getAlertMessage } from "../services/alertService.js";
import { authenticate } from "../middleware/auth.js";
import HealthProfile from "../models/HealthProfile.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query; //  Get user's location from query params
    console.log("📍 Received coordinates:", lat, lon); // For debugging

    const data = await getAlertMessage(lat, lon); //  Pass to alert service
    res.json(data);
  } catch (err) {
    console.error("❌ Alert API Error:", err);
    res.status(500).json({ error: "Alert generation failed" });
  }
});

router.get("/personal", authenticate, async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    const { lat, lon } = req.query;
    const profile = await HealthProfile.findOne({ userId: req.user.userId });
    const data = await getAlertMessage(lat, lon, profile);
    res.json(data);
  } catch (err) {
    console.error("❌ Personal alert API Error:", err);
    res.status(500).json({ error: "Personal alert generation failed" });
  }
});

export default router;