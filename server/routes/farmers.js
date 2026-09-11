import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// In-memory OTP storage: { [mobileNumber]: { otp, expiresAt } }
const otpStore = new Map();

// Helper to convert undefined to null
const toNull = v => (v === undefined ? null : v);

// GET /api/farmers - Return all farmers with all 15 database fields
router.get('/', (req, res) => {
  try {
    const { search, district, paymentMode } = req.query;
    let sql = `
      SELECT
        f.farmerIdCard,
        f.mobileNumber,
        COALESCE(NULLIF(f.farmerName, ''), NULLIF(f.fullName, ''), b.accountHolder, 'Registered Farmer') AS farmerName,
        COALESCE(NULLIF(f.fullName, ''), NULLIF(f.farmerName, ''), 'Registered Farmer') AS fullName,
        COALESCE(f.village, '') AS village,
        COALESCE(f.taluka, '') AS taluka,
        COALESCE(f.district, '') AS district,
        COALESCE(f.state, 'Gujarat') AS state,
        COALESCE(f.address, '') AS address,
        COALESCE(NULLIF(f.paymentMode, ''), NULLIF(f.preferredPaymentMode, ''), 'Online') AS paymentMode,
        COALESCE(NULLIF(f.accountHolder, ''), b.accountHolder, f.farmerName, f.fullName, '') AS accountHolder,
        COALESCE(NULLIF(f.bankName, ''), b.bankName, 'State Bank of India') AS bankName,
        COALESCE(NULLIF(f.accountNumber, ''), b.accountNumber, '') AS accountNumber,
        COALESCE(NULLIF(f.ifscCode, ''), b.ifscCode, 'SBIN0001234') AS ifscCode,
        f.createdAt,
        COALESCE(f.updatedAt, f.createdAt) AS updatedAt
      FROM farmers f
      LEFT JOIN bank_accounts b ON f.mobileNumber = b.mobileNumber
      WHERE 1=1
    `;
    const params = [];

    if (district) {
      sql += ' AND (f.district = ?)';
      params.push(district);
    }
    if (paymentMode) {
      sql += ' AND (f.paymentMode = ? OR f.preferredPaymentMode = ?)';
      params.push(paymentMode, paymentMode);
    }
    if (search) {
      sql += ' AND (f.farmerName LIKE ? OR f.fullName LIKE ? OR f.mobileNumber LIKE ? OR f.farmerIdCard LIKE ? OR f.village LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY f.createdAt DESC';
    const farmers = db.prepare(sql).all(...params);

    res.json({
      success: true,
      count: farmers.length,
      data: farmers
    });
  } catch (err) {
    console.error('Error fetching farmers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/farmers/send-otp - Dispatch OTP
router.post('/send-otp', (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const cleanMobile = (mobileNumber || '').replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number' });
    }

    // Default demo OTP 123456
    const generatedOtp = '123456';
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(cleanMobile, { otp: generatedOtp, expiresAt });

    res.json({
      success: true,
      otp: generatedOtp,
      mobileNumber: cleanMobile,
      message: 'Demo OTP: 123456'
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/farmers/verify-otp - Validate OTP and log in farmer
router.post('/verify-otp', (req, res) => {
  try {
    const { mobileNumber, otp, farmerIdCard } = req.body;
    const cleanMobile = (mobileNumber || '').replace(/\D/g, '');
    const cleanOtp = (otp || '').trim();

    if (cleanOtp !== '123456') {
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please enter demo OTP: 123456' });
    }

    let farmer = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(cleanMobile);
    let bank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(cleanMobile);
    const nowIso = new Date().toISOString();

    if (!farmer) {
      db.prepare(`
        INSERT INTO farmers (
          farmerIdCard, mobileNumber, farmerName, fullName, village, taluka, district, state, address,
          paymentMode, preferredPaymentMode, accountHolder, bankName, accountNumber, ifscCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        farmerIdCard || '10020030040',
        cleanMobile,
        'Registered Farmer',
        'Registered Farmer',
        '',
        '',
        '',
        'Gujarat',
        '',
        'Online',
        'Online',
        'Registered Farmer',
        'State Bank of India',
        '309820000000',
        'SBIN0001234',
        nowIso,
        nowIso
      );
      farmer = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(cleanMobile);
    }

    if (!bank) {
      db.prepare(`
        INSERT INTO bank_accounts (mobileNumber, accountHolder, bankName, accountNumber, ifscCode, preferredPaymentMode, updatedAt)
        VALUES (?, 'Registered Farmer', 'State Bank of India', '309820000000', 'SBIN0001234', 'Online', ?)
      `).run(cleanMobile, nowIso);
      bank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(cleanMobile);
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: { profile: farmer, bank }
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/farmers/login - Farmer login / auto-register
router.post('/login', (req, res) => {
  try {
    const { mobileNumber, farmerIdCard } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    let farmer = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(mobileNumber);
    let bank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(mobileNumber);

    const nowIso = new Date().toISOString();

    if (!farmer) {
      db.prepare(`
        INSERT INTO farmers (
          farmerIdCard, mobileNumber, farmerName, fullName, village, taluka, district, state, address,
          paymentMode, preferredPaymentMode, accountHolder, bankName, accountNumber, ifscCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        farmerIdCard || '',
        mobileNumber,
        '',
        '',
        '',
        '',
        '',
        'Gujarat',
        '',
        'Online',
        'Online',
        '',
        'State Bank of India',
        '',
        'SBIN0001234',
        nowIso,
        nowIso
      );
      farmer = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(mobileNumber);
    } else if (farmerIdCard && !farmer.farmerIdCard) {
      db.prepare('UPDATE farmers SET farmerIdCard = ?, updatedAt = ? WHERE mobileNumber = ?')
        .run(farmerIdCard, nowIso, mobileNumber);
      farmer.farmerIdCard = farmerIdCard;
    }

    if (!bank) {
      db.prepare(`
        INSERT INTO bank_accounts (mobileNumber, accountHolder, bankName, accountNumber, ifscCode, preferredPaymentMode, updatedAt)
        VALUES (?, '', 'State Bank of India', '', 'SBIN0001234', 'Online', ?)
      `).run(mobileNumber, nowIso);
      bank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(mobileNumber);
    }

    res.json({ success: true, data: { profile: farmer, bank } });
  } catch (err) {
    console.error('Error logging in farmer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/farmers/:mobileNumber - Fetch profile and bank details
router.get('/:mobileNumber', (req, res) => {
  try {
    const { mobileNumber } = req.params;
    const farmer = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(mobileNumber);
    const bank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(mobileNumber);

    if (!farmer && !bank) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }

    res.json({
      success: true,
      data: {
        profile: farmer || null,
        bank: bank || null
      }
    });
  } catch (err) {
    console.error('Error fetching farmer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/farmers/:mobileNumber/profile - Update profile
router.put('/:mobileNumber/profile', (req, res) => {
  try {
    const { mobileNumber } = req.params;
    const body = req.body;
    const nowIso = new Date().toISOString();

    const nameVal = body.farmerName || body.fullName || null;
    const modeVal = body.paymentMode || body.preferredPaymentMode || null;

    const existing = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(mobileNumber);

    if (existing) {
      db.prepare(`
        UPDATE farmers
        SET farmerIdCard = COALESCE(?, farmerIdCard),
            farmerName = COALESCE(?, farmerName),
            fullName = COALESCE(?, fullName),
            village = COALESCE(?, village),
            taluka = COALESCE(?, taluka),
            district = COALESCE(?, district),
            state = COALESCE(?, state),
            address = COALESCE(?, address),
            paymentMode = COALESCE(?, paymentMode),
            preferredPaymentMode = COALESCE(?, preferredPaymentMode),
            accountHolder = COALESCE(?, accountHolder),
            bankName = COALESCE(?, bankName),
            accountNumber = COALESCE(?, accountNumber),
            ifscCode = COALESCE(?, ifscCode),
            updatedAt = ?
        WHERE mobileNumber = ?
      `).run(
        toNull(body.farmerIdCard),
        toNull(nameVal),
        toNull(nameVal),
        toNull(body.village),
        toNull(body.taluka),
        toNull(body.district),
        toNull(body.state),
        toNull(body.address),
        toNull(modeVal),
        toNull(modeVal),
        toNull(body.accountHolder || nameVal),
        toNull(body.bankName),
        toNull(body.accountNumber),
        toNull(body.ifscCode),
        nowIso,
        mobileNumber
      );
    } else {
      db.prepare(`
        INSERT INTO farmers (
          farmerIdCard, mobileNumber, farmerName, fullName, village, taluka, district, state, address,
          paymentMode, preferredPaymentMode, accountHolder, bankName, accountNumber, ifscCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.farmerIdCard || '',
        mobileNumber,
        nameVal || '',
        nameVal || '',
        body.village || '',
        body.taluka || '',
        body.district || '',
        body.state || 'Gujarat',
        body.address || '',
        modeVal || 'Online',
        modeVal || 'Online',
        body.accountHolder || nameVal || '',
        body.bankName || 'State Bank of India',
        body.accountNumber || '',
        body.ifscCode || 'SBIN0001234',
        nowIso,
        nowIso
      );
    }

    const updated = db.prepare('SELECT * FROM farmers WHERE mobileNumber = ?').get(mobileNumber);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating farmer profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/farmers/:mobileNumber/bank - Update bank account
router.put('/:mobileNumber/bank', (req, res) => {
  try {
    const { mobileNumber } = req.params;
    const body = req.body;
    const nowIso = new Date().toISOString();

    // 1. Update bank_accounts table
    const existingBank = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(mobileNumber);
    if (existingBank) {
      db.prepare(`
        UPDATE bank_accounts
        SET accountHolder = COALESCE(?, accountHolder),
            bankName = COALESCE(?, bankName),
            accountNumber = COALESCE(?, accountNumber),
            ifscCode = COALESCE(?, ifscCode),
            preferredPaymentMode = COALESCE(?, preferredPaymentMode),
            updatedAt = ?
        WHERE mobileNumber = ?
      `).run(
        toNull(body.accountHolder),
        toNull(body.bankName),
        toNull(body.accountNumber),
        toNull(body.ifscCode),
        toNull(body.preferredPaymentMode || body.paymentMode),
        nowIso,
        mobileNumber
      );
    } else {
      db.prepare(`
        INSERT INTO bank_accounts (mobileNumber, accountHolder, bankName, accountNumber, ifscCode, preferredPaymentMode, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        mobileNumber,
        body.accountHolder || '',
        body.bankName || '',
        body.accountNumber || '',
        body.ifscCode || '',
        body.preferredPaymentMode || body.paymentMode || 'Online',
        nowIso
      );
    }

    // 2. Also keep farmers table in sync with bank fields
    db.prepare(`
      UPDATE farmers
      SET accountHolder = COALESCE(?, accountHolder),
          bankName = COALESCE(?, bankName),
          accountNumber = COALESCE(?, accountNumber),
          ifscCode = COALESCE(?, ifscCode),
          paymentMode = COALESCE(?, paymentMode),
          preferredPaymentMode = COALESCE(?, preferredPaymentMode),
          updatedAt = ?
      WHERE mobileNumber = ?
    `).run(
      toNull(body.accountHolder),
      toNull(body.bankName),
      toNull(body.accountNumber),
      toNull(body.ifscCode),
      toNull(body.preferredPaymentMode || body.paymentMode),
      toNull(body.preferredPaymentMode || body.paymentMode),
      nowIso,
      mobileNumber
    );

    const updated = db.prepare('SELECT * FROM bank_accounts WHERE mobileNumber = ?').get(mobileNumber);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating bank details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
