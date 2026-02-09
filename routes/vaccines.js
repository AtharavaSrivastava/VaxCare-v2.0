const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, sanitize } = require('../middleware/validation');

const router = express.Router();

// Get standard vaccine schedule
router.get('/schedule', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, recommended_age, description, sequence_order, is_mandatory
       FROM standard_vaccines
       ORDER BY sequence_order`
    );

    res.json({
      vaccines: result.rows
    });

  } catch (error) {
    console.error('Get vaccine schedule error:', error);
    res.status(500).json({
      error: 'Failed to retrieve vaccine schedule'
    });
  }
});

// Get user's vaccine records
router.get('/records', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.query;

    let whereClause = 'WHERE uv.user_id = $1';
    let params = [req.user.userId];

    if (childId) {
      whereClause += ' AND uv.child_id = $2';
      params.push(childId);
    }

    const result = await query(
      `SELECT uv.id, uv.administered_date, uv.healthcare_provider,
              uv.batch_number, uv.notes, uv.created_at,
              sv.name as vaccine_name, sv.description as vaccine_description,
              sv.recommended_age, sv.sequence_order,
              c.name as child_name, c.id as child_id
       FROM user_vaccines uv
       JOIN standard_vaccines sv ON uv.vaccine_id = sv.id
       LEFT JOIN children c ON uv.child_id = c.id
       ${whereClause}
       ORDER BY uv.administered_date DESC, sv.sequence_order`,
      params
    );

    res.json({
      vaccineRecords: result.rows
    });

  } catch (error) {
    console.error('Get vaccine records error:', error);
    res.status(500).json({
      error: 'Failed to retrieve vaccine records'
    });
  }
});

// Get vaccination progress/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get total vaccines completed
    const completedResult = await query(
      'SELECT COUNT(*) as completed FROM user_vaccines WHERE user_id = $1',
      [req.user.userId]
    );

    // Get total standard vaccines
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM standard_vaccines WHERE is_mandatory = true'
    );

    // Get completed vaccine IDs
    const completedVaccinesResult = await query(
      `SELECT DISTINCT sv.id, sv.name, sv.recommended_age
       FROM user_vaccines uv
       JOIN standard_vaccines sv ON uv.vaccine_id = sv.id
       WHERE uv.user_id = $1`,
      [req.user.userId]
    );

    // Get upcoming vaccines (not yet completed)
    const upcomingResult = await query(
      `SELECT sv.id, sv.name, sv.recommended_age, sv.description, sv.sequence_order
       FROM standard_vaccines sv
       WHERE sv.is_mandatory = true
       AND sv.id NOT IN (
         SELECT DISTINCT vaccine_id 
         FROM user_vaccines 
         WHERE user_id = $1
       )
       ORDER BY sv.sequence_order
       LIMIT 5`,
      [req.user.userId]
    );

    // Get children count
    const childrenResult = await query(
      'SELECT COUNT(*) as children_count FROM children WHERE user_id = $1',
      [req.user.userId]
    );

    // Get recent vaccine records
    const recentResult = await query(
      `SELECT uv.administered_date, sv.name as vaccine_name,
              c.name as child_name
       FROM user_vaccines uv
       JOIN standard_vaccines sv ON uv.vaccine_id = sv.id
       LEFT JOIN children c ON uv.child_id = c.id
       WHERE uv.user_id = $1
       ORDER BY uv.administered_date DESC
       LIMIT 5`,
      [req.user.userId]
    );

    const completed = parseInt(completedResult.rows[0].completed);
    const total = parseInt(totalResult.rows[0].total);
    const childrenCount = parseInt(childrenResult.rows[0].children_count);

    res.json({
      stats: {
        completedVaccines: completed,
        totalVaccines: total,
        upcomingVaccines: total - completed,
        familyMembers: childrenCount + 1, // +1 for the user
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      completedVaccines: completedVaccinesResult.rows,
      upcomingVaccines: upcomingResult.rows,
      recentVaccines: recentResult.rows
    });

  } catch (error) {
    console.error('Get vaccine dashboard error:', error);
    res.status(500).json({
      error: 'Failed to retrieve vaccine dashboard'
    });
  }
});

// Record a new vaccine
router.post('/record', authenticateToken, sanitize, validate('vaccine'), async (req, res) => {
  try {
    const {
      childId,
      vaccineId,
      administeredDate,
      healthcareProvider,
      batchNumber,
      notes
    } = req.validatedData;

    // Verify vaccine exists
    const vaccineResult = await query(
      'SELECT name, description FROM standard_vaccines WHERE id = $1',
      [vaccineId]
    );

    if (vaccineResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vaccine not found'
      });
    }

    // If childId provided, verify child belongs to user
    if (childId) {
      const childResult = await query(
        'SELECT name FROM children WHERE id = $1 AND user_id = $2',
        [childId, req.user.userId]
      );

      if (childResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Child not found'
        });
      }
    }

    // Check if vaccine already recorded for this user/child
    let duplicateQuery = `
      SELECT id FROM user_vaccines 
      WHERE user_id = $1 AND vaccine_id = $2
    `;
    let duplicateParams = [req.user.userId, vaccineId];

    if (childId) {
      duplicateQuery += ' AND child_id = $3';
      duplicateParams.push(childId);
    } else {
      duplicateQuery += ' AND child_id IS NULL';
    }

    const duplicateResult = await query(duplicateQuery, duplicateParams);

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        error: 'This vaccine has already been recorded'
      });
    }

    // Record the vaccine
    const result = await query(
      `INSERT INTO user_vaccines 
       (user_id, child_id, vaccine_id, administered_date, healthcare_provider, batch_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.userId, childId, vaccineId, administeredDate, healthcareProvider, batchNumber, notes]
    );

    const vaccineRecord = result.rows[0];
    const vaccine = vaccineResult.rows[0];

    res.status(201).json({
      message: 'Vaccine recorded successfully',
      vaccineRecord: {
        id: vaccineRecord.id,
        vaccineName: vaccine.name,
        vaccineDescription: vaccine.description,
        administeredDate: vaccineRecord.administered_date,
        healthcareProvider: vaccineRecord.healthcare_provider,
        batchNumber: vaccineRecord.batch_number,
        notes: vaccineRecord.notes,
        createdAt: vaccineRecord.created_at
      }
    });

  } catch (error) {
    console.error('Record vaccine error:', error);
    res.status(500).json({
      error: 'Failed to record vaccine'
    });
  }
});

// Update vaccine record
router.put('/record/:recordId', authenticateToken, sanitize, validate('vaccine'), async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      childId,
      vaccineId,
      administeredDate,
      healthcareProvider,
      batchNumber,
      notes
    } = req.validatedData;

    const result = await query(
      `UPDATE user_vaccines 
       SET child_id = $1, vaccine_id = $2, administered_date = $3,
           healthcare_provider = $4, batch_number = $5, notes = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [childId, vaccineId, administeredDate, healthcareProvider, 
       batchNumber, notes, recordId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vaccine record not found'
      });
    }

    res.json({
      message: 'Vaccine record updated successfully',
      vaccineRecord: result.rows[0]
    });

  } catch (error) {
    console.error('Update vaccine record error:', error);
    res.status(500).json({
      error: 'Failed to update vaccine record'
    });
  }
});

// Delete vaccine record
router.delete('/record/:recordId', authenticateToken, async (req, res) => {
  try {
    const { recordId } = req.params;

    const result = await query(
      'DELETE FROM user_vaccines WHERE id = $1 AND user_id = $2 RETURNING id',
      [recordId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vaccine record not found'
      });
    }

    res.json({
      message: 'Vaccine record deleted successfully'
    });

  } catch (error) {
    console.error('Delete vaccine record error:', error);
    res.status(500).json({
      error: 'Failed to delete vaccine record'
    });
  }
});

module.exports = router;