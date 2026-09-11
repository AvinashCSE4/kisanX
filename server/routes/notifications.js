import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/notifications - List notifications (optionally filtered by mobileNumber)
router.get('/', (req, res) => {
  try {
    const { mobileNumber } = req.query;
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (mobileNumber) {
      sql += " AND (mobileNumber = ? OR mobileNumber = '' OR mobileNumber IS NULL)";
      params.push(mobileNumber);
    }

    sql += ' ORDER BY createdAt DESC LIMIT 50';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
