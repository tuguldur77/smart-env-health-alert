import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../src/config/jwt.js';
import User from '../../src/models/User.js';
import HealthProfile from '../../src/models/HealthProfile.js';

const router = express.Router();

// JWT secret from environment

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Debug middleware for auth routes
router.use((req, res, next) => {
  console.log('Auth router called:', req.method, req.url);
  next();
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  console.log('Signup endpoint called with body:', req.body);
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email,
      passwordHash: hashedPassword,
      name
    });
    await user.save();

    // Create default health profile
    try {
      const healthProfile = new HealthProfile({
        userId: user._id,
        ageGroup: '19-64',
        gender: 'other',
        chronicConditions: ['none'],
        respiratorySensitivity: 'normal',
        activityTime: 'irregular',
        outdoorActivityHours: '1-3',
        workEnvironment: 'mixed',
        pmSensitivity: 'normal',
        weatherSensitivity: 'normal',
        disasterSensitivity: 'normal',
        maskUsage: 'sometimes',
        airPurifierUsage: 'rarely',
        alertSituations: ['pm10_bad', 'pm25_bad'],
        alertTimePreference: 'anytime',
        emergencyContact: { enabled: false },
        riskLevel: 'medium',
        environmentSensitivityScore: 0,
        heatSensitivityScore: 0,
        respiratoryRiskScore: 0,
        recommendedAlertThresholds: {
          pm10: 50,
          pm25: 25,
          tempHigh: 30,
          tempLow: 0
        }
      });
      await healthProfile.save();
      console.log('Health profile created successfully for user:', user._id);
    } catch (healthError) {
      console.error('Health profile creation error:', healthError);
      // Don't fail the signup if health profile creation fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('Login endpoint called with body:', req.body);
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const healthProfile = await HealthProfile.findOne({ userId });
    if (!healthProfile) {
      return res.status(404).json({ error: 'Health profile not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      healthProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Update user basic info if provided
    if (updateData.name) {
      await User.findByIdAndUpdate(userId, { name: updateData.name });
    }

    // Update health profile
    const allowedFields = [
      'ageGroup', 'gender', 'chronicConditions', 'respiratorySensitivity',
      'activityTime', 'outdoorActivityHours', 'workEnvironment',
      'pmSensitivity', 'weatherSensitivity', 'disasterSensitivity',
      'maskUsage', 'airPurifierUsage', 'alertSituations', 'alertTimePreference',
      'emergencyContact'
    ];

    const healthUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        healthUpdate[field] = updateData[field];
      }
    });

    if (Object.keys(healthUpdate).length > 0) {
      healthUpdate.updatedAt = new Date();
      await HealthProfile.findOneAndUpdate({ userId }, healthUpdate);
    }

    // Return updated profile
    const user = await User.findById(userId).select('-passwordHash');
    const healthProfile = await HealthProfile.findOne({ userId });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      healthProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;