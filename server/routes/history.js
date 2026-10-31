import express from 'express';
import RawEnvironmentData from '../../src/models/RawEnvironmentData.js';
import HourlyEnvironmentData from '../../src/models/HourlyEnvironmentData.js';

const router = express.Router();

router.get('/raw', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 12;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await RawEnvironmentData.find({ timestamp: { $gte: since } }).sort({ timestamp: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hourly', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await HourlyEnvironmentData.find({ hour: { $gte: since } }).sort({ hour: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;