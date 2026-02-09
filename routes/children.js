const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, sanitize } = require('../middleware/validation');

const router = express.Router();

// Get all children for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.date_of_birth, c.gender, c.birth_weight,
              c.birth_complications, c.created_at, c.updated_at,
              COUNT(uv.id) as vaccines_completed
       FROM children c
       LEFT JOIN user_vaccines uv ON c.id = uv.child_id
       WHERE c.user_id = $1
       GROUP BY c.id, c.name, c.date_of_birth, c.gender, c.birth_weight,
                c.birth_complications, c.created_at, c.updated_at
       ORDER BY c.created_at DESC`,
      [req.user.userId]
    );

    const children = result.rows.map(child => ({
      id: child.id,
      name: child.name,
      dateOfBirth: child.date_of_birth,
      gender: child.gender,
      birthWeight: child.birth_weight,
      birthComplications: child.birth_complications,
      vaccinesCompleted: parseInt(child.vaccines_completed),
      createdAt: child.created_at,
      updatedAt: child.updated_at
    }));

    res.json({
      children
    });

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      error: 'Failed to retrieve children'
    });
  }
});

// Get specific child
router.get('/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;

    const result = await query(
      `SELECT c.id, c.name, c.date_of_birth, c.gender, c.birth_weight,
              c.birth_complications, c.created_at, c.updated_at,
              COUNT(uv.id) as vaccines_completed
       FROM children c
       LEFT JOIN user_vaccines uv ON c.id = uv.child_id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id, c.name, c.date_of_birth, c.gender, c.birth_weight,
                c.birth_complications, c.created_at, c.updated_at`,
      [childId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Child not found'
      });
    }

    const child = result.rows[0];

    // Get child's vaccination history
    const vaccineHistory = await query(
      `SELECT uv.id, uv.administered_date, uv.healthcare_provider,
              uv.batch_number, uv.notes, sv.name as vaccine_name,
              sv.description as vaccine_description
       FROM user_vaccines uv
       JOIN standard_vaccines sv ON uv.vaccine_id = sv.id
       WHERE uv.child_id = $1
       ORDER BY uv.administered_date DESC`,
      [childId]
    );

    res.json({
      child: {
        id: child.id,
        name: child.name,
        dateOfBirth: child.date_of_birth,
        gender: child.gender,
        birthWeight: child.birth_weight,
        birthComplications: child.birth_complications,
        vaccinesCompleted: parseInt(child.vaccines_completed),
        createdAt: child.created_at,
        updatedAt: child.updated_at,
        vaccineHistory: vaccineHistory.rows
      }
    });

  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({
      error: 'Failed to retrieve child information'
    });
  }
});

// Add new child
router.post('/', authenticateToken, sanitize, validate('child'), async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      birthWeight,
      birthComplications
    } = req.validatedData;

    const result = await query(
      `INSERT INTO children 
       (user_id, name, date_of_birth, gender, birth_weight, birth_complications)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.userId, name, dateOfBirth, gender, birthWeight, birthComplications]
    );

    const child = result.rows[0];

    // Calculate age and generate vaccination reminders
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    const ageInWeeks = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 7));

    // Get upcoming vaccines based on age
    const upcomingVaccines = await query(
      `SELECT id, name, recommended_age, description
       FROM standard_vaccines
       WHERE sequence_order <= 10
       ORDER BY sequence_order`
    );

    res.status(201).json({
      message: 'Child added successfully',
      child: {
        id: child.id,
        name: child.name,
        dateOfBirth: child.date_of_birth,
        gender: child.gender,
        birthWeight: child.birth_weight,
        birthComplications: child.birth_complications,
        ageInWeeks,
        createdAt: child.created_at,
        updatedAt: child.updated_at
      },
      upcomingVaccines: upcomingVaccines.rows,
      recommendations: [
        'Schedule BCG and Hepatitis B vaccines immediately after birth',
        'Keep vaccination records safe and accessible',
        'Consult your pediatrician for personalized vaccination schedule'
      ]
    });

  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      error: 'Failed to add child'
    });
  }
});

// Update child information
router.put('/:childId', authenticateToken, sanitize, validate('child'), async (req, res) => {
  try {
    const { childId } = req.params;
    const {
      name,
      dateOfBirth,
      gender,
      birthWeight,
      birthComplications
    } = req.validatedData;

    const result = await query(
      `UPDATE children 
       SET name = $1, date_of_birth = $2, gender = $3, 
           birth_weight = $4, birth_complications = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, dateOfBirth, gender, birthWeight, birthComplications, childId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Child not found'
      });
    }

    const child = result.rows[0];

    res.json({
      message: 'Child information updated successfully',
      child: {
        id: child.id,
        name: child.name,
        dateOfBirth: child.date_of_birth,
        gender: child.gender,
        birthWeight: child.birth_weight,
        birthComplications: child.birth_complications,
        createdAt: child.created_at,
        updatedAt: child.updated_at
      }
    });

  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      error: 'Failed to update child information'
    });
  }
});

// Delete child
router.delete('/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;

    const result = await query(
      'DELETE FROM children WHERE id = $1 AND user_id = $2 RETURNING id, name',
      [childId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Child not found'
      });
    }

    res.json({
      message: `Child ${result.rows[0].name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      error: 'Failed to delete child'
    });
  }
});

module.exports = router;