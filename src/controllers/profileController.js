import mongoose from 'mongoose';
import HealthProfile from '../models/HealthProfile.js';
import { evaluateRiskLevel } from '../services/riskService.js';

export const createHealthProfile = async (req, res) => {
  try {
    let body;
    try {
      body = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    const { ageGroup, gender } = body;

    // Validate required fields
    if (!ageGroup || !gender) {
      return res.status(400).json({ error: '연령대와 성별은 필수 입력 항목입니다.' });
    }

    // Validate enum values
    const validAgeGroups = ['0-6', '7-12', '13-18', '19-64', '65+'];
    const validGenders = ['male', 'female', 'other'];

    if (!validAgeGroups.includes(ageGroup)) {
      return res.status(400).json({ error: '유효하지 않은 연령대입니다.' });
    }

    if (!validGenders.includes(gender)) {
      return res.status(400).json({ error: '유효하지 않은 성별입니다.' });
    }

    const profileData = { ...body, userId: req.user.userId };
    console.log('Profile data received:', JSON.stringify(profileData, null, 2));

    const riskData = evaluateRiskLevel(profileData);
    console.log('Risk data calculated:', riskData);

    const fullProfileData = { ...profileData, ...riskData };

    // Use upsert to create or update existing profile
    const profile = await HealthProfile.findOneAndUpdate(
      { userId: req.user.userId },
      fullProfileData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    console.log('Profile saved successfully:', profile._id);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getHealthProfile = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    const profile = await HealthProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Health profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};