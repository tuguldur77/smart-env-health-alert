import express from "express";
import { getAlertMessage } from "../services/alertService.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

// General alert endpoint (no auth required)
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

// Personal alert endpoint (requires auth)
router.get("/personal", async (req, res) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user profile (you'll need to implement this)
    // For now, just return general alerts
    const { lat, lon } = req.query;
    console.log("📍 Personal alert request for user:", decoded.id, "coordinates:", lat, lon);

    const data = await getAlertMessage(lat, lon); // Pass profile when implemented
    res.json(data);
  } catch (err) {
    console.error("❌ Personal Alert API Error:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: "Personal alert generation failed" });
  }
});

export default router;
