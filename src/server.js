import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { getJwtSecret } from './config/jwt.js';

// Routes
import weatherRoutes from './routes/weather.js';
import airRoutes from './routes/air.js';
import alertRoutes from './routes/alert.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import historyRoutes from './routes/history.js';

// Middleware
import { authenticate } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });
getJwtSecret();
const app = express();

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ No MONGODB_URI provided, skipping MongoDB connection');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Allow server to start without MongoDB for demo purposes
  }
};

connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log('>>', req.method, req.url);
  next();
});

// Static files
const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir, { index: 'index.html' }));

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/air', airRoutes);
console.log("🧪 airRoutes stack:", airRoutes.stack?.map(r => r.route?.path));
app.use('/api/alert', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/history', historyRoutes);

// SPA fallback
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;