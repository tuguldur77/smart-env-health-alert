import express from 'express';
import { getRawHistory, getHourlyHistory } from '../controllers/historyController.js';

const router = express.Router();

router.get('/raw', getRawHistory);
router.get('/hourly', getHourlyHistory);

export default router;