// ===== imports =====
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { getJwtSecret } from '../src/config/jwt.js';
import mongoose from 'mongoose';

import weatherRoutes from './routes/weather.js';
import airRoutes     from './routes/air.js';
import alertRoutes   from './routes/alert.js';
import authRoutes    from './routes/auth.js';
import historyRoutes from './routes/history.js';
import profileRoutes from './routes/profile.js';

console.log('🚀 Server starting up... UNIQUE TEST');

// ===== __dirname (ESM) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ===== init =====
dotenv.config();
if (!process.env.SEOUL_API_KEY || !process.env.KMA_API_KEY) {
  // Ensure server/.env is loaded when the app runs from repo root via npm scripts
  const localEnvPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
}

getJwtSecret();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartenv');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // process.exit(1); // Allow server to start without MongoDB for demo purposes
  }
};

connectDB();

const app = express();

app.use((req, res, next) => {
  console.log('>>', req.method, req.url);
  next();
});

const staticDir = path.join(__dirname, '..', 'public');
const indexFile = path.resolve(staticDir, 'index.html');

let files = [];
try { files = fs.readdirSync(staticDir); } catch {}
console.log(
  'Static dir =', staticDir,
  '| index =', indexFile,
  '| exists =', fs.existsSync(indexFile),
  '| files =', files
);

app.use(cors());

// Parse JSON bodies
app.use(express.json());

app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test works' });
});

// Mount the actual routes
app.use('/api/weather', weatherRoutes);
app.use('/api/air', airRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);

// Serve static files
app.use(express.static(staticDir, { index: 'index.html' }));

// Catch-all route to debug - moved after route mounting
app.use((req, res) => {
  console.log(`❓ Catch-all: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});

// app.use(express.static(staticDir, { index: 'index.html' }));

console.log('Routes registered:');
console.log('- /api/weather');
console.log('- /api/air');
console.log('- /api/alert');
console.log('- /api/auth');
console.log('- /api/history');
console.log('- /api/profile');

// Debug: Check if air routes are registered
console.log('Air routes type:', typeof airRoutes);
console.log('Air routes stack:', airRoutes?.stack?.length || 'undefined');
if (airRoutes?.stack) {
  airRoutes.stack.forEach((layer, i) => {
    console.log(`  Route ${i}: ${layer.route?.path || layer.name || 'middleware'}`);
  });
}

// Debug: Check if auth routes are registered
console.log('Auth routes type:', typeof authRoutes);
console.log('Auth routes stack:', authRoutes?.stack?.length || 'undefined');
if (authRoutes?.stack) {
  authRoutes.stack.forEach((layer, i) => {
    console.log(`  Auth Route ${i}: ${layer.route?.path || layer.name || 'middleware'}`);
  });
}

// ===== fallback for SPA =====
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  console.log('FALLBACK ->', req.path, '->', indexFile);
  res.sendFile(indexFile, err => {
    if (err) { console.error('fallback error:', err); next(err); }
  });
});

// ===== listen =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

