const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, sanitize } = require('../middleware/validation');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, date_of_birth, blood_group, genetic_conditions,
              known_allergies, current_symptoms, location, created_at, updated_at
       FROM user_profiles 
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const profile = result.rows[0];

    res.json({
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth,
        bloodGroup: profile.blood_group,
        geneticConditions: profile.genetic_conditions,
        knownAllergies: profile.known_allergies,
        currentSymptoms: profile.current_symptoms,
        location: profile.location,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile'
    });
  }
});

// Create or update user profile
router.post('/', authenticateToken, sanitize, validate('profile'), async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      bloodGroup,
      geneticConditions,
      knownAllergies,
      currentSymptoms,
      location
    } = req.validatedData;

    // Check if profile exists
    const existingProfile = await query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [req.user.userId]
    );

    let result;

    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await query(
        `UPDATE user_profiles 
         SET full_name = $1, date_of_birth = $2, blood_group = $3,
             genetic_conditions = $4, known_allergies = $5, current_symptoms = $6,
             location = $7, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8
         RETURNING *`,
        [fullName, dateOfBirth, bloodGroup, geneticConditions, 
         knownAllergies, currentSymptoms, location, req.user.userId]
      );
    } else {
      // Create new profile
      result = await query(
        `INSERT INTO user_profiles 
         (user_id, full_name, date_of_birth, blood_group, genetic_conditions,
          known_allergies, current_symptoms, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.userId, fullName, dateOfBirth, bloodGroup, geneticConditions,
         knownAllergies, currentSymptoms, location]
      );
    }

    const profile = result.rows[0];

    // Check for health alerts based on symptoms
    const alerts = [];
    if (currentSymptoms) {
      const symptoms = currentSymptoms.toLowerCase();
      if (symptoms.includes('fever') || symptoms.includes('cough') || symptoms.includes('rash')) {
        alerts.push({
          type: 'warning',
          message: 'Based on your symptoms, please consult a healthcare provider before getting vaccinated.'
        });
      }
    }

    res.json({
      message: existingProfile.rows.length > 0 ? 'Profile updated successfully' : 'Profile created successfully',
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth,
        bloodGroup: profile.blood_group,
        geneticConditions: profile.genetic_conditions,
        knownAllergies: profile.known_allergies,
        currentSymptoms: profile.current_symptoms,
        location: profile.location,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      },
      healthAlerts: alerts
    });

  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({
      error: 'Failed to save profile'
    });
  }
});

// Delete user profile
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM user_profiles WHERE user_id = $1 RETURNING id',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json({
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      error: 'Failed to delete profile'
    });
  }
});

module.exports = router;