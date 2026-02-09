const express = require('express');
const { query } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all active vaccine drives
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { location, type, upcoming } = req.query;
    
    let whereClause = 'WHERE is_active = true';
    let params = [];
    let paramCount = 0;

    // Filter by location if provided
    if (location) {
      paramCount++;
      whereClause += ` AND (location ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      params.push(`%${location}%`);
    }

    // Filter by drive type if provided
    if (type && ['vaccine', 'safety'].includes(type)) {
      paramCount++;
      whereClause += ` AND drive_type = $${paramCount}`;
      params.push(type);
    }

    // Filter upcoming drives only
    if (upcoming === 'true') {
      whereClause += ' AND drive_date >= CURRENT_DATE';
    }

    const result = await query(
      `SELECT id, title, description, drive_type, location, address,
              drive_date, start_time, end_time, organizer, contact_info,
              created_at, updated_at
       FROM vaccine_drives
       ${whereClause}
       ORDER BY drive_date ASC, start_time ASC`,
      params
    );

    // Format the drives for response
    const drives = result.rows.map(drive => ({
      id: drive.id,
      title: drive.title,
      description: drive.description,
      type: drive.drive_type,
      location: drive.location,
      address: drive.address,
      date: drive.drive_date,
      startTime: drive.start_time,
      endTime: drive.end_time,
      organizer: drive.organizer,
      contactInfo: drive.contact_info,
      isUpcoming: new Date(drive.drive_date) >= new Date(),
      createdAt: drive.created_at,
      updatedAt: drive.updated_at
    }));

    res.json({
      drives,
      total: drives.length,
      filters: {
        location: location || null,
        type: type || null,
        upcomingOnly: upcoming === 'true'
      }
    });

  } catch (error) {
    console.error('Get drives error:', error);
    res.status(500).json({
      error: 'Failed to retrieve vaccine drives'
    });
  }
});

// Get specific drive details
router.get('/:driveId', optionalAuth, async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await query(
      `SELECT id, title, description, drive_type, location, address,
              drive_date, start_time, end_time, organizer, contact_info,
              created_at, updated_at
       FROM vaccine_drives
       WHERE id = $1 AND is_active = true`,
      [driveId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vaccine drive not found'
      });
    }

    const drive = result.rows[0];

    res.json({
      drive: {
        id: drive.id,
        title: drive.title,
        description: drive.description,
        type: drive.drive_type,
        location: drive.location,
        address: drive.address,
        date: drive.drive_date,
        startTime: drive.start_time,
        endTime: drive.end_time,
        organizer: drive.organizer,
        contactInfo: drive.contact_info,
        isUpcoming: new Date(drive.drive_date) >= new Date(),
        createdAt: drive.created_at,
        updatedAt: drive.updated_at
      }
    });

  } catch (error) {
    console.error('Get drive details error:', error);
    res.status(500).json({
      error: 'Failed to retrieve drive details'
    });
  }
});

// Get drives by location (for user's area)
router.get('/location/:location', optionalAuth, async (req, res) => {
  try {
    const { location } = req.params;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT id, title, description, drive_type, location, address,
              drive_date, start_time, end_time, organizer, contact_info
       FROM vaccine_drives
       WHERE is_active = true 
       AND (location ILIKE $1 OR address ILIKE $1)
       AND drive_date >= CURRENT_DATE
       ORDER BY drive_date ASC, start_time ASC
       LIMIT $2`,
      [`%${location}%`, parseInt(limit)]
    );

    const drives = result.rows.map(drive => ({
      id: drive.id,
      title: drive.title,
      description: drive.description,
      type: drive.drive_type,
      location: drive.location,
      address: drive.address,
      date: drive.drive_date,
      startTime: drive.start_time,
      endTime: drive.end_time,
      organizer: drive.organizer,
      contactInfo: drive.contact_info
    }));

    res.json({
      drives,
      location,
      total: drives.length
    });

  } catch (error) {
    console.error('Get drives by location error:', error);
    res.status(500).json({
      error: 'Failed to retrieve drives for location'
    });
  }
});

// Get upcoming drives (next 30 days)
router.get('/upcoming/next30days', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, drive_type, location, address,
              drive_date, start_time, end_time, organizer, contact_info
       FROM vaccine_drives
       WHERE is_active = true 
       AND drive_date >= CURRENT_DATE
       AND drive_date <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY drive_date ASC, start_time ASC`,
      []
    );

    const drives = result.rows.map(drive => ({
      id: drive.id,
      title: drive.title,
      description: drive.description,
      type: drive.drive_type,
      location: drive.location,
      address: drive.address,
      date: drive.drive_date,
      startTime: drive.start_time,
      endTime: drive.end_time,
      organizer: drive.organizer,
      contactInfo: drive.contact_info,
      daysUntil: Math.ceil((new Date(drive.drive_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      drives,
      total: drives.length,
      period: 'next 30 days'
    });

  } catch (error) {
    console.error('Get upcoming drives error:', error);
    res.status(500).json({
      error: 'Failed to retrieve upcoming drives'
    });
  }
});

// Search drives
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query: searchQuery } = req.params;
    const { limit = 20 } = req.query;

    const result = await query(
      `SELECT id, title, description, drive_type, location, address,
              drive_date, start_time, end_time, organizer, contact_info
       FROM vaccine_drives
       WHERE is_active = true 
       AND (
         title ILIKE $1 OR 
         description ILIKE $1 OR 
         location ILIKE $1 OR 
         organizer ILIKE $1
       )
       ORDER BY 
         CASE WHEN drive_date >= CURRENT_DATE THEN 0 ELSE 1 END,
         drive_date ASC, start_time ASC
       LIMIT $2`,
      [`%${searchQuery}%`, parseInt(limit)]
    );

    const drives = result.rows.map(drive => ({
      id: drive.id,
      title: drive.title,
      description: drive.description,
      type: drive.drive_type,
      location: drive.location,
      address: drive.address,
      date: drive.drive_date,
      startTime: drive.start_time,
      endTime: drive.end_time,
      organizer: drive.organizer,
      contactInfo: drive.contact_info,
      isUpcoming: new Date(drive.drive_date) >= new Date()
    }));

    res.json({
      drives,
      searchQuery,
      total: drives.length
    });

  } catch (error) {
    console.error('Search drives error:', error);
    res.status(500).json({
      error: 'Failed to search drives'
    });
  }
});

module.exports = router;