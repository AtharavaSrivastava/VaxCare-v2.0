console.log("notifications route file loaded");
const express = require("express");
const { query } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all notifications for logged in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, message, notification_type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({
      notifications: result.rows
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "Failed to retrieve notifications"
    });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, message, type, is_read, created_at`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0]
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      error: "Failed to update notification"
    });
  }
});

// Delete a notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    res.json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      error: "Failed to delete notification"
    });
  }
});

module.exports = router;
