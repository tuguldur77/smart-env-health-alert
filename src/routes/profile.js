import express from 'express';
import { createHealthProfile, getHealthProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createHealthProfile);
router.get('/', authenticate, getHealthProfile);

export default router;