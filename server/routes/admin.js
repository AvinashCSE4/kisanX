import { Router } from 'express';
import { db, seedInitialData, clearAllData } from '../db.js';

const router = Router();

// GET /api/admin/stats - Aggregated analytics
router.get('/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as totalBookings, SUM(quantity) as totalQuantity, SUM(totalAmount) as totalAmount FROM bookings').get();
    
    const completedRow = db.prepare("SELECT COUNT(*) as count, SUM(totalAmount) as paidAmount FROM bookings WHERE status = 'Sale Completed'").get();

    const pendingPaymentRow = db.prepare("SELECT COUNT(*) as count, SUM(totalAmount) as pendingAmount FROM bookings WHERE status != 'Sale Completed' AND status != 'Cancelled'").get();

    const statusCounts = db.prepare('SELECT status, COUNT(*) as count FROM bookings GROUP BY status').all();

    const centreStats = db.prepare(`
      SELECT centreId, centre, COUNT(*) as totalBookings,
             SUM(CASE WHEN status = 'Sale Completed' THEN 1 ELSE 0 END) as completedBookings,
             SUM(quantity) as totalQuantity
      FROM bookings
      GROUP BY centreId
    `).all();

    res.json({
      success: true,
      data: {
        totalBookings: totalRow?.totalBookings || 0,
        totalTonnage: Math.round(((totalRow?.totalQuantity || 0) / 1000) * 10) / 10,
        totalValue: totalRow?.totalAmount || 0,
        completedBookings: completedRow?.count || 0,
        disbursedAmount: completedRow?.paidAmount || 0,
        pendingPaymentCount: pendingPaymentRow?.count || 0,
        statusBreakdown: statusCounts,
        centreBreakdown: centreStats
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/clear-all - Remove all old data
router.post('/clear-all', (req, res) => {
  try {
    clearAllData();
    res.json({ success: true, message: 'All old data removed successfully from SQLite database.' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/reset-seed - Force re-seed database
router.post('/reset-seed', (req, res) => {
  try {
    seedInitialData(true);
    res.json({ success: true, message: 'Database reset and re-seeded successfully.' });
  } catch (err) {
    console.error('Error re-seeding database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
