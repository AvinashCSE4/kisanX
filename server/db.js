import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'kisanx.db');

export const db = new DatabaseSync(dbPath);

// Enable WAL mode for performance
db.exec(`PRAGMA journal_mode = WAL;`);

// Create Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS farmers (
    farmerIdCard TEXT,
    mobileNumber TEXT PRIMARY KEY,
    farmerName TEXT,
    fullName TEXT,
    village TEXT,
    taluka TEXT,
    district TEXT,
    state TEXT,
    address TEXT,
    paymentMode TEXT DEFAULT 'Online',
    preferredPaymentMode TEXT DEFAULT 'Online',
    accountHolder TEXT,
    bankName TEXT,
    accountNumber TEXT,
    ifscCode TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobileNumber TEXT UNIQUE,
    accountHolder TEXT,
    bankName TEXT,
    accountNumber TEXT,
    ifscCode TEXT,
    preferredPaymentMode TEXT DEFAULT 'Online',
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    sellingId TEXT UNIQUE,
    farmerName TEXT,
    mobileNumber TEXT,
    farmerIdCard TEXT,
    village TEXT,
    taluka TEXT,
    district TEXT,
    state TEXT,
    crop TEXT,
    variety TEXT,
    quantity REAL,
    unit TEXT DEFAULT 'kg',
    centreId TEXT,
    centre TEXT,
    centreName TEXT,
    date TEXT,
    sessionId TEXT,
    sessionStartTime TEXT,
    sessionEndTime TEXT,
    timeSlot TEXT,
    tokenNumber INTEGER,
    centreToken TEXT,
    queueToken TEXT,
    queuePosition INTEGER,
    membersAhead INTEGER DEFAULT 0,
    estimatedWaitMinutes INTEGER DEFAULT 15,
    estimatedTurnTime TEXT,
    recommendedArrivalTime TEXT,
    reportGateTime TEXT,
    averageProcessingTime INTEGER DEFAULT 15,
    activeCounters INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Booked',
    finalQuantity REAL,
    approvedRate REAL,
    totalAmount REAL,
    paymentMode TEXT DEFAULT 'Online',
    paymentStatus TEXT DEFAULT 'Pending',
    paymentDate TEXT,
    paymentId TEXT,
    bankName TEXT,
    accountNumber TEXT,
    ifscCode TEXT,
    razorpayPayoutId TEXT,
    utrNumber TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS live_queues (
    queueKey TEXT PRIMARY KEY,
    currentToken INTEGER DEFAULT 1,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    mobileNumber TEXT,
    title TEXT,
    message TEXT,
    date TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT
  );
`);

// Migration helper: dynamically ensure all 15 required fields exist in farmers table
const requiredFarmerCols = [
  { name: 'farmerIdCard', type: 'TEXT' },
  { name: 'farmerName', type: 'TEXT' },
  { name: 'fullName', type: 'TEXT' },
  { name: 'village', type: 'TEXT' },
  { name: 'taluka', type: 'TEXT' },
  { name: 'district', type: 'TEXT' },
  { name: 'state', type: 'TEXT' },
  { name: 'address', type: 'TEXT' },
  { name: 'paymentMode', type: "TEXT DEFAULT 'Online'" },
  { name: 'preferredPaymentMode', type: "TEXT DEFAULT 'Online'" },
  { name: 'accountHolder', type: 'TEXT' },
  { name: 'bankName', type: 'TEXT' },
  { name: 'accountNumber', type: 'TEXT' },
  { name: 'ifscCode', type: 'TEXT' },
  { name: 'createdAt', type: 'TEXT' },
  { name: 'updatedAt', type: 'TEXT' }
];

try {
  const existingCols = db.prepare(`PRAGMA table_info(farmers)`).all().map(c => c.name);
  for (const col of requiredFarmerCols) {
    if (!existingCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE farmers ADD COLUMN ${col.name} ${col.type};`);
      } catch (err) {
        // ignore if already present
      }
    }
  }

  // Populate any missing fields from bank_accounts and bookings
  db.exec(`
    UPDATE farmers
    SET farmerName = COALESCE(NULLIF(farmerName, ''), fullName),
        fullName = COALESCE(NULLIF(fullName, ''), farmerName),
        paymentMode = COALESCE(NULLIF(paymentMode, ''), preferredPaymentMode, 'Online'),
        preferredPaymentMode = COALESCE(NULLIF(preferredPaymentMode, ''), paymentMode, 'Online')
    WHERE farmerName IS NULL OR paymentMode IS NULL;
  `);

  const banks = db.prepare('SELECT * FROM bank_accounts').all();
  const updStmt = db.prepare(`
    UPDATE farmers
    SET accountHolder = COALESCE(NULLIF(accountHolder, ''), ?),
        bankName = COALESCE(NULLIF(bankName, ''), ?),
        accountNumber = COALESCE(NULLIF(accountNumber, ''), ?),
        ifscCode = COALESCE(NULLIF(ifscCode, ''), ?)
    WHERE mobileNumber = ?
  `);
  for (const b of banks) {
    updStmt.run(b.accountHolder, b.bankName, b.accountNumber, b.ifscCode, b.mobileNumber);
  }
} catch (migErr) {
  console.warn('Farmers table migration warning:', migErr.message);
}

// 4 Procurement Centres (Venues)
export const CENTRES = [
  { id: 'apmc-main', name: 'APMC Mandi Main Yard', prefix: 'AM' },
  { id: 'district-hub', name: 'District Procurement Hub', prefix: 'DH' },
  { id: 'kvk', name: 'Kisan Vikas Kendra', prefix: 'KV' },
  { id: 'taluka-mandi', name: 'Taluka Mandi Centre', prefix: 'TM' }
];

export const SESSIONS = [
  { id: 'session-1', time: '08:00 AM - 10:00 AM', startHour: 8, startMinute: 0 },
  { id: 'session-2', time: '10:00 AM - 12:00 PM', startHour: 10, startMinute: 0 },
  { id: 'session-3', time: '12:00 PM - 02:00 PM', startHour: 12, startMinute: 0 },
  { id: 'session-4', time: '02:00 PM - 04:00 PM', startHour: 14, startMinute: 0 }
];

export const FARMER_NAMES = [
  'Rajesh Sharma', 'Bhavesh Patel', 'Mansukh Bhai', 'Vikram Singh', 'Arvind Rathod',
  'Dinesh Kumar', 'Suresh Bhai', 'Harish Chandra', 'Kishan Lal', 'Gopal Das',
  'Pravin Bhai', 'Mahesh Verma', 'Jitendra Dave', 'Raju Bhai', 'Naresh Patel',
  'Ashok Singh', 'Vinod Yadav', 'Kantilal Shah', 'Mukesh Parmar', 'Bharat Bhai',
  'Sunil Chaudhary', 'Govind Bhai', 'Dilip Solanki', 'Jayesh Joshi', 'Ramesh Chandra',
  'Paresh Patel', 'Chirag Dave', 'Anil Sharma', 'Lalit Kumar', 'Deepak Chauhan',
  'Bipin Patel', 'Sanjay Yadav', 'Kamlesh Verma', 'Pankaj Shah', 'Vipul Solanki',
  'Hitesh Parmar', 'Amrit Bhai', 'Nitin Joshi', 'Vijay Rathod', 'Prakash Patel',
  'Tarun Kumar', 'Rohit Singh', 'Manish Dave', 'Kishore Sharma', 'Ajay Verma',
  'Haresh Patel', 'Ghanshyam Das', 'Sandip Solanki', 'Nilesh Parmar', 'Chetan Shah'
];

export const DATES = [
  '10 September 2026',
  '11 September 2026',
  '12 September 2026',
  '13 September 2026',
  '14 September 2026'
];

const CROPS_CONFIG = [
  { name: 'Wheat', rate: 25, variety: 'Lokwan Golden' },
  { name: 'Cotton', rate: 68, variety: 'Bt-Cotton Shanker-6' },
  { name: 'Rice', rate: 32, variety: 'Basmati Super' },
  { name: 'Groundnut', rate: 58, variety: 'GG-20 Bold' },
  { name: 'Maize', rate: 22, variety: 'African Tall Hybrid' },
  { name: 'Bajra', rate: 24, variety: 'Hybrid Super Bajra' },
  { name: 'Mustard', rate: 52, variety: 'Pusa Bold Yellow' },
  { name: 'Soybean', rate: 45, variety: 'JS-335 Grade A' },
  { name: 'Chana', rate: 54, variety: 'Desi Chana Bold' }
];

const VILLAGES = [
  { village: 'Anandpur', taluka: 'Petlad', district: 'Anand' },
  { village: 'Sanand', taluka: 'Sanand', district: 'Ahmedabad' },
  { village: 'Borsad', taluka: 'Borsad', district: 'Anand' },
  { village: 'Morbi', taluka: 'Morbi', district: 'Morbi' },
  { village: 'Kheda', taluka: 'Matar', district: 'Kheda' },
  { village: 'Bardoli', taluka: 'Bardoli', district: 'Surat' },
  { village: 'Mehsana', taluka: 'Mehsana', district: 'Mehsana' },
  { village: 'Dholka', taluka: 'Dholka', district: 'Ahmedabad' },
  { village: 'Nadiad', taluka: 'Nadiad', district: 'Kheda' },
  { village: 'Godhra', taluka: 'Godhra', district: 'Panchmahal' }
];

const BANKS = [
  { name: 'State Bank of India', ifsc: 'SBIN0001234' },
  { name: 'Bank of Baroda', ifsc: 'BARB0ANANDX' },
  { name: 'HDFC Bank', ifsc: 'HDFC0004567' },
  { name: 'Punjab National Bank', ifsc: 'PUNB0123400' },
  { name: 'Axis Bank', ifsc: 'UTIB0002891' }
];

function format12Hour(hours24, minutes) {
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let h12 = hours24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Remove all existing records and seed:
 * - 2 Main Venues (APMC Mandi Main Yard: 24, District Procurement Hub: 20) -> High Traffic Load (44 total)
 * - 2 Satellite Venues (Kisan Vikas Kendra: exactly 3, Taluka Mandi Centre: exactly 3) -> Low Traffic Load (6 total)
 * Total: exactly 50 dataset records
 */
export function seed50RandomBookings() {
  console.log('Clearing all records from SQLite...');
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM live_queues;
    DELETE FROM notifications;
    DELETE FROM farmers;
    DELETE FROM bank_accounts;
  `);

  const insertBooking = db.prepare(`
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

  const insertFarmer = db.prepare(`
    INSERT INTO farmers (
      farmerIdCard, mobileNumber, farmerName, fullName, village, taluka, district, state, address,
      paymentMode, preferredPaymentMode, accountHolder, bankName, accountNumber, ifscCode, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBank = db.prepare(`
    INSERT INTO bank_accounts (
      mobileNumber, accountHolder, bankName, accountNumber, ifscCode, preferredPaymentMode, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, mobileNumber, title, message, date, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Define the slot plan:
  // 1. APMC Mandi Main Yard (apmc-main): 24 bookings (heavy load)
  // 2. District Procurement Hub (district-hub): 20 bookings (heavy load)
  // 3. Kisan Vikas Kendra (kvk): exactly 3 bookings
  // 4. Taluka Mandi Centre (taluka-mandi): exactly 3 bookings
  const venueSlotPlan = [];

  // 24 slots for apmc-main
  for (let i = 0; i < 24; i++) {
    venueSlotPlan.push({
      centre: CENTRES[0], // apmc-main
      date: DATES[i % DATES.length],
      session: SESSIONS[i % SESSIONS.length],
      statusGroup: i < 6 ? 'Sale Completed' : (i < 11 ? 'Weighed' : (i < 16 ? 'Crop Verified' : (i < 20 ? 'Arrived' : 'Booked')))
    });
  }

  // 20 slots for district-hub
  for (let i = 0; i < 20; i++) {
    venueSlotPlan.push({
      centre: CENTRES[1], // district-hub
      date: DATES[i % DATES.length],
      session: SESSIONS[i % SESSIONS.length],
      statusGroup: i < 4 ? 'Sale Completed' : (i < 8 ? 'Weighed' : (i < 12 ? 'Crop Verified' : (i < 16 ? 'Arrived' : 'Booked')))
    });
  }

  // EXACTLY 3 slots for kvk (Kisan Vikas Kendra)
  venueSlotPlan.push({ centre: CENTRES[2], date: DATES[0], session: SESSIONS[0], statusGroup: 'Crop Verified' });
  venueSlotPlan.push({ centre: CENTRES[2], date: DATES[1], session: SESSIONS[1], statusGroup: 'Booked' });
  venueSlotPlan.push({ centre: CENTRES[2], date: DATES[2], session: SESSIONS[2], statusGroup: 'Sale Completed' });

  // EXACTLY 3 slots for taluka-mandi (Taluka Mandi Centre)
  venueSlotPlan.push({ centre: CENTRES[3], date: DATES[0], session: SESSIONS[1], statusGroup: 'Arrived' });
  venueSlotPlan.push({ centre: CENTRES[3], date: DATES[1], session: SESSIONS[0], statusGroup: 'Booked' });
  venueSlotPlan.push({ centre: CENTRES[3], date: DATES[3], session: SESSIONS[3], statusGroup: 'Sale Completed' });

  // Track session token counts
  const sessionTokenTracker = {};
  const createdBookings = [];
  const now = new Date();

  for (let i = 0; i < venueSlotPlan.length; i++) {
    const plan = venueSlotPlan[i];
    const farmerName = FARMER_NAMES[i % FARMER_NAMES.length];
    const mobileNumber = `98251${String(100101 + i).slice(1)}`;
    const farmerIdCard = `1002003${String(10101 + i).slice(1)}`;
    const loc = VILLAGES[i % VILLAGES.length];
    const cropObj = CROPS_CONFIG[i % CROPS_CONFIG.length];
    const bankObj = BANKS[i % BANKS.length];

    const centre = plan.centre;
    const date = plan.date;
    const session = plan.session;

    const sessionKey = `${centre.id}_${date}_${session.id}`;
    sessionTokenTracker[sessionKey] = (sessionTokenTracker[sessionKey] || 0) + 1;
    const tokenNum = sessionTokenTracker[sessionKey];
    const centreToken = `${centre.prefix}-${String(tokenNum).padStart(3, '0')}`;

    // Calculate realistic turn times
    const sessionStartMin = session.startHour * 60 + session.startMinute;
    const turnMinutes = sessionStartMin + (tokenNum - 1) * 15;
    const turnHours24 = Math.floor(turnMinutes / 60) % 24;
    const turnMins = turnMinutes % 60;
    const estimatedTurnTime = format12Hour(turnHours24, turnMins);

    const reportMinutes = Math.max(sessionStartMin, turnMinutes - 5);
    const reportGateTime = format12Hour(Math.floor(reportMinutes / 60) % 24, reportMinutes % 60);

    const arrivalMin = Math.max(sessionStartMin, turnMinutes - 10);
    const recommendedArrivalTime = format12Hour(Math.floor(arrivalMin / 60) % 24, arrivalMin % 60);

    const quantity = 250 + ((i * 47) % 1350);
    const approvedRate = cropObj.rate;
    const totalAmount = quantity * approvedRate;

    const status = plan.statusGroup;
    const paymentMode = i % 2 === 0 ? 'Online' : 'Cash';
    const isPaid = status === 'Sale Completed';
    const paymentStatus = isPaid ? 'Paid' : 'Pending';
    const paymentDate = isPaid ? date : '';
    const paymentId = isPaid
      ? (paymentMode === 'Cash' ? `CASH-VCHR-${800000 + i}` : `PAY-${800000 + i}`)
      : '';
    const razorpayPayoutId = isPaid && paymentMode === 'Online' ? `pout_seed_${800000 + i}` : null;
    const utrNumber = isPaid && paymentMode === 'Online' ? `UTR20260910${800000 + i}` : null;

    const sellingId = `KS-2026-${String(700000 + i)}`;
    const id = `b-seed-${700000 + i}`;
    const createdAt = new Date(now.getTime() - (50 - i) * 3600 * 1000).toISOString();

    // 1. Insert Booking
    insertBooking.run(
      id,
      sellingId,
      farmerName,
      mobileNumber,
      farmerIdCard,
      loc.village,
      loc.taluka,
      loc.district,
      'Gujarat',
      cropObj.name,
      cropObj.variety,
      quantity,
      'kg',
      centre.id,
      centre.name,
      centre.name,
      date,
      session.id,
      session.time.split(' - ')[0],
      session.time.split(' - ')[1],
      session.time,
      tokenNum,
      centreToken,
      centreToken,
      tokenNum,
      Math.max(0, tokenNum - 1),
      tokenNum * 15,
      estimatedTurnTime,
      recommendedArrivalTime,
      reportGateTime,
      15,
      1,
      status,
      quantity,
      approvedRate,
      totalAmount,
      paymentMode,
      paymentStatus,
      paymentDate,
      paymentId,
      bankObj.name,
      `3098${String(20000000 + i * 197).slice(1)}`,
      bankObj.ifsc,
      razorpayPayoutId,
      utrNumber,
      createdAt
    );

    // 2. Insert Farmer Profile (All 15 database fields)
    insertFarmer.run(
      farmerIdCard,
      mobileNumber,
      farmerName,
      farmerName,
      loc.village,
      loc.taluka,
      loc.district,
      'Gujarat',
      `${loc.village} Main Road, Taluka ${loc.taluka}`,
      paymentMode,
      paymentMode,
      farmerName,
      bankObj.name,
      `3098${String(20000000 + i * 197).slice(1)}`,
      bankObj.ifsc,
      createdAt,
      createdAt
    );

    // 3. Insert Bank Account
    insertBank.run(
      mobileNumber,
      farmerName,
      bankObj.name,
      `3098${String(20000000 + i * 197).slice(1)}`,
      bankObj.ifsc,
      paymentMode,
      createdAt
    );

    // 4. Insert Notification
    insertNotification.run(
      `notif-${id}`,
      mobileNumber,
      isPaid
        ? `Payment Disbursed: ₹${totalAmount.toLocaleString('en-IN')}`
        : `Slot Booked: ${sellingId} (${centreToken})`,
      isPaid
        ? `Direct benefit transfer of ₹${totalAmount.toLocaleString('en-IN')} has been disbursed for Selling ID ${sellingId}.`
        : `Slot booked for ${cropObj.name} at ${centre.name} on ${date}. Token: ${centreToken}.`,
      'Recent',
      isPaid ? 1 : 0,
      createdAt
    );

    createdBookings.push({
      id,
      sellingId,
      farmerName,
      centre: centre.name,
      centreId: centre.id,
      date,
      status
    });
  }

  // 5. Seed Live Queues
  const insertQueue = db.prepare(`INSERT OR REPLACE INTO live_queues (queueKey, currentToken, updatedAt) VALUES (?, ?, ?)`);
  for (const session of SESSIONS) {
    insertQueue.run(session.time, 1, now.toISOString());
  }
  for (const centre of CENTRES) {
    for (const date of DATES) {
      for (const session of SESSIONS) {
        const key = `${centre.id}_${date}_${session.id}`;
        const curr = sessionTokenTracker[key] ? Math.min(sessionTokenTracker[key], 2) : 1;
        insertQueue.run(key, curr, now.toISOString());
      }
    }
  }

  console.log(`Successfully generated and seeded: APMC Main: 24, District Hub: 20, KVK: 3, Taluka Mandi: 3 (Total: ${venueSlotPlan.length})`);
  return createdBookings;
}

export function clearAllData() {
  console.log('Clearing all old data from SQLite database...');
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM notifications;
    DELETE FROM farmers;
    DELETE FROM bank_accounts;
    UPDATE live_queues SET currentToken = 1;
  `);
  console.log('All old data removed successfully.');
}

export function seedInitialData(force = false) {
  if (force) {
    seed50RandomBookings();
  }
}
