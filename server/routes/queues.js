import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/queues/live - Get all live serving tokens
router.get('/live', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM live_queues').all();
    const tokenMap = {};
    rows.forEach(r => {
      tokenMap[r.queueKey] = r.currentToken;
    });
    res.json({ success: true, data: tokenMap });
  } catch (err) {
    console.error('Error fetching live queues:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/queues/advance - Advance token
router.post('/advance', (req, res) => {
  try {
    const { queueKey, centreId, date, sessionId } = req.body;
    const resolvedKey = queueKey || `${centreId}_${date}_${sessionId}`;

    if (!resolvedKey) {
      return res.status(400).json({ success: false, error: 'Queue key or centre details required' });
    }

    const row = db.prepare('SELECT * FROM live_queues WHERE queueKey = ?').get(resolvedKey);
    const curr = row ? row.currentToken : 1;
    const nextToken = Math.min(8, curr + 1);
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO live_queues (queueKey, currentToken, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(queueKey) DO UPDATE SET currentToken = excluded.currentToken, updatedAt = excluded.updatedAt
    `).run(resolvedKey, nextToken, nowIso);

    res.json({ success: true, queueKey: resolvedKey, currentToken: nextToken });
  } catch (err) {
    console.error('Error advancing queue token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
