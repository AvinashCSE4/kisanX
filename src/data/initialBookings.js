import {
  CENTRES_CONFIG,
  SESSIONS_CONFIG,
  generateCentreToken
} from '../utils/smartQueueEngine.js';

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

const FARMER_NAMES = [
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

const DATES = [
  '10 September 2026',
  '11 September 2026',
  '12 September 2026',
  '13 September 2026',
  '14 September 2026'
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

function format12Hour(hours24, minutes) {
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let h12 = hours24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * 2 Main Venues (APMC Main: 24, District Hub: 20) with heavy load
 * 2 Other Venues (KVK: 3, Taluka Mandi: 3) with light load
 * Total: 50 bookings
 */
export const generate50SeedBookings = () => {
  const bookings = [];
  const sessionTokenTracker = {};
  const now = new Date();

  const venueSlotPlan = [];

  // 24 slots for apmc-main (Main Yard - Heavy traffic)
  for (let i = 0; i < 24; i++) {
    venueSlotPlan.push({
      centre: CENTRES_CONFIG[0], // apmc-main
      date: DATES[i % DATES.length],
      session: SESSIONS_CONFIG[i % SESSIONS_CONFIG.length],
      statusGroup: i < 6 ? 'Sale Completed' : (i < 11 ? 'Weighed' : (i < 16 ? 'Crop Verified' : (i < 20 ? 'Arrived' : 'Booked')))
    });
  }

  // 20 slots for district-hub (District Hub - Heavy traffic)
  for (let i = 0; i < 20; i++) {
    venueSlotPlan.push({
      centre: CENTRES_CONFIG[1], // district-hub
      date: DATES[i % DATES.length],
      session: SESSIONS_CONFIG[i % SESSIONS_CONFIG.length],
      statusGroup: i < 4 ? 'Sale Completed' : (i < 8 ? 'Weighed' : (i < 12 ? 'Crop Verified' : (i < 16 ? 'Arrived' : 'Booked')))
    });
  }

  // EXACTLY 3 slots for kvk (KVK - Light traffic)
  venueSlotPlan.push({ centre: CENTRES_CONFIG[2], date: DATES[0], session: SESSIONS_CONFIG[0], statusGroup: 'Crop Verified' });
  venueSlotPlan.push({ centre: CENTRES_CONFIG[2], date: DATES[1], session: SESSIONS_CONFIG[1], statusGroup: 'Booked' });
  venueSlotPlan.push({ centre: CENTRES_CONFIG[2], date: DATES[2], session: SESSIONS_CONFIG[2], statusGroup: 'Sale Completed' });

  // EXACTLY 3 slots for taluka-mandi (Taluka Mandi - Light traffic)
  venueSlotPlan.push({ centre: CENTRES_CONFIG[3], date: DATES[0], session: SESSIONS_CONFIG[1], statusGroup: 'Arrived' });
  venueSlotPlan.push({ centre: CENTRES_CONFIG[3], date: DATES[1], session: SESSIONS_CONFIG[0], statusGroup: 'Booked' });
  venueSlotPlan.push({ centre: CENTRES_CONFIG[3], date: DATES[3], session: SESSIONS_CONFIG[3], statusGroup: 'Sale Completed' });

  for (let i = 0; i < venueSlotPlan.length; i++) {
    const plan = venueSlotPlan[i];
    const farmerName = FARMER_NAMES[i % FARMER_NAMES.length];
    const mobileNumber = `98251${String(100101 + i).slice(1)}`;
    const farmerIdCard = `1002003${String(10101 + i).slice(1)}`;
    const loc = VILLAGES[i % VILLAGES.length];
    const cropObj = CROPS_CONFIG[i % CROPS_CONFIG.length];

    const centre = plan.centre;
    const date = plan.date;
    const session = plan.session;

    const sessionKey = `${centre.id}_${date}_${session.id}`;
    sessionTokenTracker[sessionKey] = (sessionTokenTracker[sessionKey] || 0) + 1;
    const tokenNum = sessionTokenTracker[sessionKey];
    const centreToken = generateCentreToken(centre.id, tokenNum);

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

    bookings.push({
      id,
      sellingId,
      farmerName,
      mobileNumber,
      farmerIdCard,
      village: loc.village,
      taluka: loc.taluka,
      district: loc.district,
      state: 'Gujarat',
      crop: cropObj.name,
      variety: cropObj.variety,
      quantity,
      unit: 'kg',
      centreId: centre.id,
      centre: centre.name,
      centreName: centre.name,
      date,
      sessionId: session.id,
      sessionStartTime: session.time.split(' - ')[0],
      sessionEndTime: session.time.split(' - ')[1],
      timeSlot: session.time,
      tokenNumber: tokenNum,
      centreToken,
      queueToken: centreToken,
      queuePosition: tokenNum,
      membersAhead: Math.max(0, tokenNum - 1),
      estimatedWaitMinutes: tokenNum * 15,
      estimatedTurnTime,
      recommendedArrivalTime,
      reportGateTime,
      averageProcessingTime: 15,
      activeCounters: 1,
      status,
      finalQuantity: quantity,
      approvedRate,
      totalAmount,
      paymentMode,
      paymentStatus,
      paymentDate,
      paymentId,
      bankName: 'State Bank of India',
      accountNumber: `3098${String(20000000 + i * 197).slice(1)}`,
      ifscCode: 'SBIN0001234',
      razorpayPayoutId,
      utrNumber,
      createdAt
    });
  }

  return bookings;
};

export const generateNew3BookingsPerSession = generate50SeedBookings;
