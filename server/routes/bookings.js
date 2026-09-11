import { Router } from 'express';
import { db, CENTRES, SESSIONS } from '../db.js';

const router = Router();

// Helper to format 12-hour time string
function format12Hour(hours24, minutes) {
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let h12 = hours24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

// GET /api/bookings - Query with filters
router.get('/', (req, res) => {
  try {
    const { mobileNumber, centreId, date, sessionId, status, search } = req.query;
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (mobileNumber) {
      sql += ' AND mobileNumber = ?';
      params.push(mobileNumber);
    }
    if (centreId) {
      sql += ' AND centreId = ?';
      params.push(centreId);
    }
    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    if (sessionId) {
      sql += ' AND sessionId = ?';
      params.push(sessionId);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (sellingId LIKE ? OR farmerName LIKE ? OR mobileNumber LIKE ? OR centreToken LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bookings/:sellingId - Single booking
router.get('/:sellingId', (req, res) => {
  try {
    const { sellingId } = req.params;
    const cleanId = sellingId.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error finding booking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bookings - Create new booking
router.post('/', (req, res) => {
  try {
    const body = req.body;
    const targetDate = body.date || '10 September 2026';
    const centreConfig = CENTRES.find(c => c.id === (body.centreId || body.centre)) || CENTRES[0];
    const sessionConfig = SESSIONS.find(s => s.id === (body.sessionId || body.timeSlot)) || SESSIONS[0];

    // Count existing active bookings in this centre + date + session
    const existingRow = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE centreId = ? AND date = ? AND sessionId = ? AND status NOT IN ('Cancelled', 'Rescheduled')
    `).get(centreConfig.id, targetDate, sessionConfig.id);

    const tokenNumber = Math.min(8, (existingRow?.count || 0) + 1);
    const centreToken = `${centreConfig.prefix}-${String(tokenNumber).padStart(3, '0')}`;

    // Calculate dynamic turn & arrival times
    const sessionStartMin = sessionConfig.startHour * 60 + sessionConfig.startMinute;
    const turnMinutes = sessionStartMin + (tokenNumber - 1) * 15;
    const turnHours24 = Math.floor(turnMinutes / 60) % 24;
    const turnMins = turnMinutes % 60;
    const estimatedTurnTime = format12Hour(turnHours24, turnMins);

    const reportMinutes = Math.max(sessionStartMin, turnMinutes - 5);
    const rH24 = Math.floor(reportMinutes / 60) % 24;
    const rMins = reportMinutes % 60;
    const reportGateTime = format12Hour(rH24, rMins);

    const arrivalMin = Math.max(sessionStartMin, turnMinutes - 10);
    const aH24 = Math.floor(arrivalMin / 60) % 24;
    const aMins = arrivalMin % 60;
    const recommendedArrivalTime = format12Hour(aH24, aMins);

    // Generate Selling ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const sellingId = `KS-2026-${randomDigits}`;
    const id = `b-${Date.now()}`;

    const qty = Number(body.quantity) || 100;
    const rate = body.approvedRate || 25;
    const totalAmount = qty * rate;
    const nowIso = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        id, sellingId, farmerName, mobileNumber, farmerIdCard, village, taluka, district, state,
        crop, variety, quantity, unit, centreId, centre, centreName, date, sessionId,
        sessionStartTime, sessionEndTime, timeSlot, tokenNumber, centreToken, queueToken,
        queuePosition, membersAhead, estimatedWaitMinutes, estimatedTurnTime, recommendedArrivalTime,
        reportGateTime, averageProcessingTime, activeCounters, status, finalQuantity, approvedRate,
        totalAmount, paymentMode, paymentStatus, paymentDate, paymentId, bankName, accountNumber,
        ifscCode, razorpayPayoutId, utrNumber, createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      id,
      sellingId,
      body.farmerName || 'Farmer',
      body.mobileNumber || '',
      body.farmerIdCard || '10020030040',
      body.village || '',
      body.taluka || '',
      body.district || '',
      body.state || '',
      body.crop || 'Wheat',
      body.variety || 'Standard',
      qty,
      body.unit || 'kg',
      centreConfig.id,
      centreConfig.name,
      centreConfig.name,
      targetDate,
      sessionConfig.id,
      sessionConfig.time.split(' - ')[0],
      sessionConfig.time.split(' - ')[1],
      sessionConfig.time,
      tokenNumber,
      centreToken,
      centreToken,
      tokenNumber,
      Math.max(0, tokenNumber - 1),
      tokenNumber * 15,
      estimatedTurnTime,
      recommendedArrivalTime,
      reportGateTime,
      15,
      1,
      'Booked',
      qty,
      rate,
      totalAmount,
      body.paymentMode || 'Online',
      'Pending',
      '',
      '',
      body.bankName || 'Registered Bank',
      body.accountNumber || '',
      body.ifscCode || '',
      null,
      null,
      nowIso
    );

    // Create confirmation notification
    const notifId = `n-${Date.now()}`;
    db.prepare(`
      INSERT INTO notifications (id, mobileNumber, title, message, date, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(
      notifId,
      body.mobileNumber || '',
      `Slot Booked: ${sellingId} (${centreToken})`,
      `${body.crop} booked at ${centreConfig.name} for ${targetDate} (${sessionConfig.time}). Token: ${centreToken}. Turn: ${estimatedTurnTime}. Recommended Arrival: ${recommendedArrivalTime}.`,
      'Just now',
      nowIso
    );

    const created = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/bookings/:sellingId/status - Update stage
router.put('/:sellingId/status', (req, res) => {
  try {
    const { sellingId } = req.params;
    const { status } = req.body;
    const cleanId = sellingId.trim().toUpperCase();

    const existing = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE UPPER(sellingId) = ?').run(status, cleanId);
    const updated = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bookings/:sellingId/payment - Record payment disbursement
router.post('/:sellingId/payment', (req, res) => {
  try {
    const { sellingId } = req.params;
    const { finalQuantity, approvedRate, paymentMode, paymentId, razorpayPayoutId, utrNumber } = req.body;
    const cleanId = sellingId.trim().toUpperCase();

    const existing = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const qty = Number(finalQuantity) || existing.quantity;
    const rate = Number(approvedRate) || existing.approvedRate;
    const totalAmount = qty * rate;
    const mode = paymentMode || existing.paymentMode || 'Online';
    const payId = paymentId || (mode === 'Cash' ? `CASH-VCHR-${Date.now().toString().slice(-6)}` : `PAY-${Date.now().toString().slice(-6)}`);
    const payDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE bookings
      SET finalQuantity = ?, approvedRate = ?, totalAmount = ?, paymentMode = ?,
          paymentStatus = 'Paid', paymentDate = ?, paymentId = ?, status = 'Sale Completed',
          razorpayPayoutId = ?, utrNumber = ?
      WHERE UPPER(sellingId) = ?
    `).run(qty, rate, totalAmount, mode, payDate, payId, razorpayPayoutId || null, utrNumber || null, cleanId);

    const updated = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);

    // Create payout notification
    const isCash = mode === 'Cash';
    const title = isCash ? `Cash Voucher Ready: ₹${totalAmount.toLocaleString('en-IN')}` : `Payment Disbursed: ₹${totalAmount.toLocaleString('en-IN')}`;
    const message = isCash
      ? `Cash payout voucher of ₹${totalAmount.toLocaleString('en-IN')} for Selling ID ${cleanId} is ready at APMC Mandi Cash Counter.`
      : `Direct benefit transfer (DBT) of ₹${totalAmount.toLocaleString('en-IN')} for Selling ID ${cleanId} has been credited to your bank account.`;

    db.prepare(`
      INSERT INTO notifications (id, mobileNumber, title, message, date, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(`n-${Date.now()}`, existing.mobileNumber, title, message, 'Just now', nowIso);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/bookings/:sellingId/missed - Mark missed
router.put('/:sellingId/missed', (req, res) => {
  try {
    const { sellingId } = req.params;
    const cleanId = sellingId.trim().toUpperCase();

    const existing = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    db.prepare("UPDATE bookings SET status = 'Missed' WHERE UPPER(sellingId) = ?").run(cleanId);
    const updated = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);

    db.prepare(`
      INSERT INTO notifications (id, mobileNumber, title, message, date, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(
      `n-missed-${Date.now()}`,
      existing.mobileNumber,
      `Slot Missed: ${cleanId}`,
      `You missed your slot for ${existing.crop} at ${existing.centre}. Use "Missed Slot Recovery" to rebook the next available session quickly.`,
      'Just now',
      new Date().toISOString()
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error marking booking missed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bookings/:sellingId/reschedule - Reschedule missed booking
router.post('/:sellingId/reschedule', (req, res) => {
  try {
    const { sellingId } = req.params;
    const { newCentreId, newDate, newSessionId } = req.body;
    const cleanId = sellingId.trim().toUpperCase();

    const existing = db.prepare('SELECT * FROM bookings WHERE UPPER(sellingId) = ?').get(cleanId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Original booking not found' });
    }

    // Mark original as Missed (Rebooked)
    db.prepare("UPDATE bookings SET status = 'Missed (Rebooked)' WHERE UPPER(sellingId) = ?").run(cleanId);

    // Create new booking with old details but new slot
    const centreConfig = CENTRES.find(c => c.id === newCentreId) || CENTRES[0];
    const sessionConfig = SESSIONS.find(s => s.id === newSessionId) || SESSIONS[0];

    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE centreId = ? AND date = ? AND sessionId = ? AND status NOT IN ('Cancelled', 'Rescheduled')
    `).get(centreConfig.id, newDate, sessionConfig.id);

    const tokenNumber = Math.min(8, (countRow?.count || 0) + 1);
    const centreToken = `${centreConfig.prefix}-${String(tokenNumber).padStart(3, '0')}`;

    const sessionStartMin = sessionConfig.startHour * 60 + sessionConfig.startMinute;
    const turnMinutes = sessionStartMin + (tokenNumber - 1) * 15;
    const turnHours24 = Math.floor(turnMinutes / 60) % 24;
    const turnMins = turnMinutes % 60;
    const estimatedTurnTime = format12Hour(turnHours24, turnMins);

    const reportMinutes = Math.max(sessionStartMin, turnMinutes - 5);
    const reportGateTime = format12Hour(Math.floor(reportMinutes / 60) % 24, reportMinutes % 60);

    const arrivalMin = Math.max(sessionStartMin, turnMinutes - 10);
    const recommendedArrivalTime = format12Hour(Math.floor(arrivalMin / 60) % 24, arrivalMin % 60);

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newSellingId = `KS-2026-${randomDigits}`;
    const newId = `b-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        id, sellingId, farmerName, mobileNumber, farmerIdCard, village, taluka, district, state,
        crop, variety, quantity, unit, centreId, centre, centreName, date, sessionId,
        sessionStartTime, sessionEndTime, timeSlot, tokenNumber, centreToken, queueToken,
        queuePosition, membersAhead, estimatedWaitMinutes, estimatedTurnTime, recommendedArrivalTime,
        reportGateTime, averageProcessingTime, activeCounters, status, finalQuantity, approvedRate,
        totalAmount, paymentMode, paymentStatus, paymentDate, paymentId, bankName, accountNumber,
        ifscCode, razorpayPayoutId, utrNumber, createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      newId,
      newSellingId,
      existing.farmerName,
      existing.mobileNumber,
      existing.farmerIdCard,
      existing.village,
      existing.taluka,
      existing.district,
      existing.state,
      existing.crop,
      existing.variety,
      existing.quantity,
      existing.unit,
      centreConfig.id,
      centreConfig.name,
      centreConfig.name,
      newDate,
      sessionConfig.id,
      sessionConfig.time.split(' - ')[0],
      sessionConfig.time.split(' - ')[1],
      sessionConfig.time,
      tokenNumber,
      centreToken,
      centreToken,
      tokenNumber,
      Math.max(0, tokenNumber - 1),
      tokenNumber * 15,
      estimatedTurnTime,
      recommendedArrivalTime,
      reportGateTime,
      15,
      1,
      'Booked',
      existing.quantity,
      existing.approvedRate,
      existing.totalAmount,
      existing.paymentMode,
      'Pending',
      '',
      '',
      existing.bankName,
      existing.accountNumber,
      existing.ifscCode,
      null,
      null,
      nowIso
    );

    db.prepare(`
      INSERT INTO notifications (id, mobileNumber, title, message, date, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(
      `n-resched-${Date.now()}`,
      existing.mobileNumber,
      `Missed Slot Rebooked: ${newSellingId}`,
      `Your missed booking ${cleanId} has been successfully rescheduled to ${centreConfig.name} on ${newDate} (${sessionConfig.time}). New Token: ${centreToken}.`,
      'Just now',
      nowIso
    );

    const rebooked = db.prepare('SELECT * FROM bookings WHERE id = ?').get(newId);
    res.json({ success: true, data: rebooked });
  } catch (err) {
    console.error('Error rescheduling booking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
