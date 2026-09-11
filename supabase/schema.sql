-- =====================================================================
-- KisanX - Supabase PostgreSQL Database Schema & Complete Seed Dataset
-- Execute this file in your Supabase Project: SQL Editor -> Run
-- =====================================================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLE: procurement_centres
CREATE TABLE IF NOT EXISTS procurement_centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  location TEXT,
  operating_hours TEXT DEFAULT '08:00 AM - 06:00 PM',
  daily_capacity INTEGER DEFAULT 32,
  active_counters INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TABLE: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  start_minute INTEGER DEFAULT 0,
  max_slots INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE TABLE: farmers (All 15 attributes)
CREATE TABLE IF NOT EXISTS farmers (
  mobile_number TEXT PRIMARY KEY,
  farmer_id_card TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  village TEXT,
  taluka TEXT,
  district TEXT,
  state TEXT DEFAULT 'Gujarat',
  address TEXT,
  payment_mode TEXT DEFAULT 'Online',
  preferred_payment_mode TEXT DEFAULT 'Online',
  account_holder TEXT,
  bank_name TEXT DEFAULT 'State Bank of India',
  account_number TEXT,
  ifsc_code TEXT DEFAULT 'SBIN0001234',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE TABLE: bookings (Procurement, Slots, Weighments & Disbursements)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  selling_id TEXT UNIQUE NOT NULL,
  farmer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  farmer_id_card TEXT NOT NULL,
  village TEXT,
  taluka TEXT,
  district TEXT,
  state TEXT DEFAULT 'Gujarat',
  crop TEXT NOT NULL,
  variety TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  centre_id TEXT NOT NULL,
  centre TEXT,
  centre_name TEXT,
  date TEXT NOT NULL,
  session_id TEXT NOT NULL,
  session_start_time TEXT,
  session_end_time TEXT,
  time_slot TEXT,
  token_number INTEGER DEFAULT 1,
  centre_token TEXT,
  queue_token TEXT,
  queue_position INTEGER DEFAULT 1,
  members_ahead INTEGER DEFAULT 0,
  estimated_wait_minutes INTEGER DEFAULT 15,
  estimated_turn_time TEXT,
  recommended_arrival_time TEXT,
  report_gate_time TEXT,
  average_processing_time INTEGER DEFAULT 15,
  active_counters INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Booked',
  final_quantity NUMERIC,
  approved_rate NUMERIC,
  total_amount NUMERIC,
  payment_mode TEXT DEFAULT 'Online',
  payment_status TEXT DEFAULT 'Pending',
  payment_date TEXT,
  payment_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  razorpay_payout_id TEXT,
  utr_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE TABLE: live_queues
CREATE TABLE IF NOT EXISTS live_queues (
  queue_key TEXT PRIMARY KEY,
  current_token INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  mobile_number TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TEXT DEFAULT 'Just now',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE VIEWS FOR SALES & PAYMENTS
CREATE OR REPLACE VIEW sales_view AS
SELECT * FROM bookings WHERE status = 'Sale Completed';

CREATE OR REPLACE VIEW payments_view AS
SELECT * FROM bookings WHERE payment_status = 'Paid';

-- 9. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anon read & write for KisanX application frontend
DROP POLICY IF EXISTS "Public access on procurement_centres" ON procurement_centres;
CREATE POLICY "Public access on procurement_centres" ON procurement_centres FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on sessions" ON sessions;
CREATE POLICY "Public access on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on farmers" ON farmers;
CREATE POLICY "Public access on farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on bookings" ON bookings;
CREATE POLICY "Public access on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on live_queues" ON live_queues;
CREATE POLICY "Public access on live_queues" ON live_queues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on notifications" ON notifications;
CREATE POLICY "Public access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 10. SEED DATASET: 4 PROCUREMENT CENTRES
-- =====================================================================
INSERT INTO procurement_centres (id, name, prefix, location, operating_hours, daily_capacity, active_counters)
VALUES
  ('apmc-main', 'APMC Mandi Main Yard', 'AM', 'Yard Gate 1, Mandi Road, Amreli', '08:00 AM - 06:00 PM', 32, 4),
  ('district-hub', 'District Procurement Hub', 'DH', 'Warehouse Area, District Yard, Amreli', '08:00 AM - 06:00 PM', 32, 3),
  ('kvk', 'Kisan Vikas Kendra', 'KV', 'Agricultural Research Complex, Babra', '08:00 AM - 04:00 PM', 16, 2),
  ('taluka-mandi', 'Taluka Mandi Centre', 'TM', 'Taluka Yard, Dhari Road', '08:00 AM - 04:00 PM', 16, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  prefix = EXCLUDED.prefix,
  location = EXCLUDED.location;

-- =====================================================================
-- 11. SEED DATASET: 4 SESSIONS
-- =====================================================================
INSERT INTO sessions (id, time, start_hour, start_minute, max_slots)
VALUES
  ('session-1', '08:00 AM - 10:00 AM', 8, 0, 3),
  ('session-2', '10:00 AM - 12:00 PM', 10, 0, 3),
  ('session-3', '12:00 PM - 02:00 PM', 12, 0, 3),
  ('session-4', '02:00 PM - 04:00 PM', 14, 0, 3)
ON CONFLICT (id) DO UPDATE SET
  time = EXCLUDED.time,
  start_hour = EXCLUDED.start_hour,
  start_minute = EXCLUDED.start_minute;

-- =====================================================================
-- 12. SEED DATASET: 50 DEMO FARMERS (All 15 Attributes)
-- =====================================================================
INSERT INTO farmers (
  mobile_number, farmer_id_card, farmer_name, full_name, village, taluka, district, state,
  address, payment_mode, preferred_payment_mode, account_holder, bank_name, account_number, ifsc_code
)
VALUES
  ('9876543210', '10020030040', 'Ramesh Bhai Patel', 'Ramesh Bhai Patel', 'Babra', 'Amreli', 'Amreli', 'Gujarat', 'Babra Main Road, Taluka Amreli', 'Online', 'Online', 'Ramesh Bhai Patel', 'State Bank of India', '309820010040', 'SBIN0001234'),
  ('9825100100', '10020030100', 'Rajesh Sharma', 'Rajesh Sharma', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Anandpur Main Road, Taluka Petlad', 'Online', 'Online', 'Rajesh Sharma', 'State Bank of India', '309820000100', 'SBIN0001234'),
  ('9825100101', '10020030101', 'Bhavesh Patel', 'Bhavesh Patel', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Sanand Main Road, Taluka Sanand', 'Cash', 'Cash', 'Bhavesh Patel', 'Bank of Baroda', '309820000101', 'BARB0ANANDX'),
  ('9825100102', '10020030102', 'Mansukh Bhai', 'Mansukh Bhai', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Borsad Main Road, Taluka Borsad', 'Online', 'Online', 'Mansukh Bhai', 'HDFC Bank', '309820000102', 'HDFC0000123'),
  ('9825100103', '10020030103', 'Vikram Singh', 'Vikram Singh', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Morbi Main Road, Taluka Morbi', 'Cash', 'Cash', 'Vikram Singh', 'Punjab National Bank', '309820000103', 'PUNB0123400'),
  ('9825100104', '10020030104', 'Arvind Rathod', 'Arvind Rathod', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Kheda Main Road, Taluka Matar', 'Online', 'Online', 'Arvind Rathod', 'State Bank of India', '309820000104', 'SBIN0001234'),
  ('9825100105', '10020030105', 'Dinesh Kumar', 'Dinesh Kumar', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bardoli Main Road, Taluka Bardoli', 'Cash', 'Cash', 'Dinesh Kumar', 'Bank of Baroda', '309820000105', 'BARB0ANANDX'),
  ('9825100106', '10020030106', 'Suresh Bhai', 'Suresh Bhai', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mehsana Main Road, Taluka Mehsana', 'Online', 'Online', 'Suresh Bhai', 'HDFC Bank', '309820000106', 'HDFC0000123'),
  ('9825100107', '10020030107', 'Harish Chandra', 'Harish Chandra', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Dholka Main Road, Taluka Dholka', 'Cash', 'Cash', 'Harish Chandra', 'Punjab National Bank', '309820000107', 'PUNB0123400'),
  ('9825100108', '10020030108', 'Kishan Lal', 'Kishan Lal', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Nadiad Main Road, Taluka Nadiad', 'Online', 'Online', 'Kishan Lal', 'State Bank of India', '309820000108', 'SBIN0001234'),
  ('9825100109', '10020030109', 'Gopal Das', 'Gopal Das', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Godhra Main Road, Taluka Godhra', 'Cash', 'Cash', 'Gopal Das', 'Bank of Baroda', '309820000109', 'BARB0ANANDX'),
  ('9825100110', '10020030110', 'Pravin Bhai', 'Pravin Bhai', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Anandpur Main Road, Taluka Petlad', 'Online', 'Online', 'Pravin Bhai', 'HDFC Bank', '309820000110', 'HDFC0000123'),
  ('9825100111', '10020030111', 'Mahesh Verma', 'Mahesh Verma', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Sanand Main Road, Taluka Sanand', 'Cash', 'Cash', 'Mahesh Verma', 'Punjab National Bank', '309820000111', 'PUNB0123400'),
  ('9825100112', '10020030112', 'Jitendra Dave', 'Jitendra Dave', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Borsad Main Road, Taluka Borsad', 'Online', 'Online', 'Jitendra Dave', 'State Bank of India', '309820000112', 'SBIN0001234'),
  ('9825100113', '10020030113', 'Raju Bhai', 'Raju Bhai', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Morbi Main Road, Taluka Morbi', 'Cash', 'Cash', 'Raju Bhai', 'Bank of Baroda', '309820000113', 'BARB0ANANDX'),
  ('9825100114', '10020030114', 'Naresh Patel', 'Naresh Patel', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Kheda Main Road, Taluka Matar', 'Online', 'Online', 'Naresh Patel', 'HDFC Bank', '309820000114', 'HDFC0000123'),
  ('9825100115', '10020030115', 'Ashok Singh', 'Ashok Singh', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bardoli Main Road, Taluka Bardoli', 'Cash', 'Cash', 'Ashok Singh', 'Punjab National Bank', '309820000115', 'PUNB0123400'),
  ('9825100116', '10020030116', 'Vinod Yadav', 'Vinod Yadav', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mehsana Main Road, Taluka Mehsana', 'Online', 'Online', 'Vinod Yadav', 'State Bank of India', '309820000116', 'SBIN0001234'),
  ('9825100117', '10020030117', 'Kantilal Shah', 'Kantilal Shah', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Dholka Main Road, Taluka Dholka', 'Cash', 'Cash', 'Kantilal Shah', 'Bank of Baroda', '309820000117', 'BARB0ANANDX'),
  ('9825100118', '10020030118', 'Mukesh Parmar', 'Mukesh Parmar', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Nadiad Main Road, Taluka Nadiad', 'Online', 'Online', 'Mukesh Parmar', 'HDFC Bank', '309820000118', 'HDFC0000123'),
  ('9825100119', '10020030119', 'Bharat Bhai', 'Bharat Bhai', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Godhra Main Road, Taluka Godhra', 'Cash', 'Cash', 'Bharat Bhai', 'Punjab National Bank', '309820000119', 'PUNB0123400'),
  ('9825100120', '10020030120', 'Sunil Chaudhary', 'Sunil Chaudhary', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Anandpur Main Road, Taluka Petlad', 'Online', 'Online', 'Sunil Chaudhary', 'State Bank of India', '309820000120', 'SBIN0001234'),
  ('9825100121', '10020030121', 'Govind Bhai', 'Govind Bhai', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Sanand Main Road, Taluka Sanand', 'Cash', 'Cash', 'Govind Bhai', 'Bank of Baroda', '309820000121', 'BARB0ANANDX'),
  ('9825100122', '10020030122', 'Dilip Solanki', 'Dilip Solanki', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Borsad Main Road, Taluka Borsad', 'Online', 'Online', 'Dilip Solanki', 'HDFC Bank', '309820000122', 'HDFC0000123'),
  ('9825100123', '10020030123', 'Jayesh Joshi', 'Jayesh Joshi', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Morbi Main Road, Taluka Morbi', 'Cash', 'Cash', 'Jayesh Joshi', 'Punjab National Bank', '309820000123', 'PUNB0123400'),
  ('9825100124', '10020030124', 'Ramesh Chandra', 'Ramesh Chandra', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Kheda Main Road, Taluka Matar', 'Online', 'Online', 'Ramesh Chandra', 'State Bank of India', '309820000124', 'SBIN0001234'),
  ('9825100125', '10020030125', 'Paresh Patel', 'Paresh Patel', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bardoli Main Road, Taluka Bardoli', 'Cash', 'Cash', 'Paresh Patel', 'Bank of Baroda', '309820000125', 'BARB0ANANDX'),
  ('9825100126', '10020030126', 'Chirag Dave', 'Chirag Dave', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mehsana Main Road, Taluka Mehsana', 'Online', 'Online', 'Chirag Dave', 'HDFC Bank', '309820000126', 'HDFC0000123'),
  ('9825100127', '10020030127', 'Anil Sharma', 'Anil Sharma', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Dholka Main Road, Taluka Dholka', 'Cash', 'Cash', 'Anil Sharma', 'Punjab National Bank', '309820000127', 'PUNB0123400'),
  ('9825100128', '10020030128', 'Lalit Kumar', 'Lalit Kumar', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Nadiad Main Road, Taluka Nadiad', 'Online', 'Online', 'Lalit Kumar', 'State Bank of India', '309820000128', 'SBIN0001234'),
  ('9825100129', '10020030129', 'Deepak Chauhan', 'Deepak Chauhan', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Godhra Main Road, Taluka Godhra', 'Cash', 'Cash', 'Deepak Chauhan', 'Bank of Baroda', '309820000129', 'BARB0ANANDX'),
  ('9825100130', '10020030130', 'Bipin Patel', 'Bipin Patel', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Anandpur Main Road, Taluka Petlad', 'Online', 'Online', 'Bipin Patel', 'HDFC Bank', '309820000130', 'HDFC0000123'),
  ('9825100131', '10020030131', 'Sanjay Yadav', 'Sanjay Yadav', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Sanand Main Road, Taluka Sanand', 'Cash', 'Cash', 'Sanjay Yadav', 'Punjab National Bank', '309820000131', 'PUNB0123400'),
  ('9825100132', '10020030132', 'Kamlesh Verma', 'Kamlesh Verma', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Borsad Main Road, Taluka Borsad', 'Online', 'Online', 'Kamlesh Verma', 'State Bank of India', '309820000132', 'SBIN0001234'),
  ('9825100133', '10020030133', 'Pankaj Shah', 'Pankaj Shah', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Morbi Main Road, Taluka Morbi', 'Cash', 'Cash', 'Pankaj Shah', 'Bank of Baroda', '309820000133', 'BARB0ANANDX'),
  ('9825100134', '10020030134', 'Vipul Solanki', 'Vipul Solanki', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Kheda Main Road, Taluka Matar', 'Online', 'Online', 'Vipul Solanki', 'HDFC Bank', '309820000134', 'HDFC0000123'),
  ('9825100135', '10020030135', 'Hitesh Parmar', 'Hitesh Parmar', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bardoli Main Road, Taluka Bardoli', 'Cash', 'Cash', 'Hitesh Parmar', 'Punjab National Bank', '309820000135', 'PUNB0123400'),
  ('9825100136', '10020030136', 'Amrit Bhai', 'Amrit Bhai', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mehsana Main Road, Taluka Mehsana', 'Online', 'Online', 'Amrit Bhai', 'State Bank of India', '309820000136', 'SBIN0001234'),
  ('9825100137', '10020030137', 'Nitin Joshi', 'Nitin Joshi', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Dholka Main Road, Taluka Dholka', 'Cash', 'Cash', 'Nitin Joshi', 'Bank of Baroda', '309820000137', 'BARB0ANANDX'),
  ('9825100138', '10020030138', 'Vijay Rathod', 'Vijay Rathod', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Nadiad Main Road, Taluka Nadiad', 'Online', 'Online', 'Vijay Rathod', 'HDFC Bank', '309820000138', 'HDFC0000123'),
  ('9825100139', '10020030139', 'Prakash Patel', 'Prakash Patel', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Godhra Main Road, Taluka Godhra', 'Cash', 'Cash', 'Prakash Patel', 'Punjab National Bank', '309820000139', 'PUNB0123400'),
  ('9825100140', '10020030140', 'Tarun Kumar', 'Tarun Kumar', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Anandpur Main Road, Taluka Petlad', 'Online', 'Online', 'Tarun Kumar', 'State Bank of India', '309820000140', 'SBIN0001234'),
  ('9825100141', '10020030141', 'Rohit Singh', 'Rohit Singh', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Sanand Main Road, Taluka Sanand', 'Cash', 'Cash', 'Rohit Singh', 'Bank of Baroda', '309820000141', 'BARB0ANANDX'),
  ('9825100142', '10020030142', 'Manish Dave', 'Manish Dave', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Borsad Main Road, Taluka Borsad', 'Online', 'Online', 'Manish Dave', 'HDFC Bank', '309820000142', 'HDFC0000123'),
  ('9825100143', '10020030143', 'Kishore Sharma', 'Kishore Sharma', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Morbi Main Road, Taluka Morbi', 'Cash', 'Cash', 'Kishore Sharma', 'Punjab National Bank', '309820000143', 'PUNB0123400'),
  ('9825100144', '10020030144', 'Ajay Verma', 'Ajay Verma', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Kheda Main Road, Taluka Matar', 'Online', 'Online', 'Ajay Verma', 'State Bank of India', '309820000144', 'SBIN0001234'),
  ('9825100145', '10020030145', 'Haresh Patel', 'Haresh Patel', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bardoli Main Road, Taluka Bardoli', 'Cash', 'Cash', 'Haresh Patel', 'Bank of Baroda', '309820000145', 'BARB0ANANDX'),
  ('9825100146', '10020030146', 'Ghanshyam Das', 'Ghanshyam Das', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mehsana Main Road, Taluka Mehsana', 'Online', 'Online', 'Ghanshyam Das', 'HDFC Bank', '309820000146', 'HDFC0000123'),
  ('9825100147', '10020030147', 'Sandip Solanki', 'Sandip Solanki', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Dholka Main Road, Taluka Dholka', 'Cash', 'Cash', 'Sandip Solanki', 'Punjab National Bank', '309820000147', 'PUNB0123400'),
  ('9825100148', '10020030148', 'Nilesh Parmar', 'Nilesh Parmar', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Nadiad Main Road, Taluka Nadiad', 'Online', 'Online', 'Nilesh Parmar', 'State Bank of India', '309820000148', 'SBIN0001234'),
  ('9825100149', '10020030149', 'Chetan Shah', 'Chetan Shah', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Godhra Main Road, Taluka Godhra', 'Cash', 'Cash', 'Chetan Shah', 'Bank of Baroda', '309820000149', 'BARB0ANANDX')
ON CONFLICT (mobile_number) DO UPDATE SET
  farmer_id_card = EXCLUDED.farmer_id_card,
  farmer_name = EXCLUDED.farmer_name,
  full_name = EXCLUDED.full_name,
  village = EXCLUDED.village,
  taluka = EXCLUDED.taluka,
  district = EXCLUDED.district,
  address = EXCLUDED.address,
  payment_mode = EXCLUDED.payment_mode,
  account_holder = EXCLUDED.account_holder,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  ifsc_code = EXCLUDED.ifsc_code;

-- =====================================================================
-- 13. SEED DATASET: 50 DEMO BOOKINGS, SALES & PAYMENTS
-- =====================================================================
INSERT INTO bookings (
  id, selling_id, farmer_name, mobile_number, farmer_id_card, village, taluka, district, state,
  crop, variety, quantity, unit, centre_id, centre, centre_name, date, session_id,
  session_start_time, session_end_time, time_slot, token_number, centre_token, queue_token,
  queue_position, members_ahead, estimated_wait_minutes, estimated_turn_time, recommended_arrival_time,
  report_gate_time, average_processing_time, active_counters, status, final_quantity, approved_rate,
  total_amount, payment_mode, payment_status, payment_date, payment_id, bank_name, account_number,
  ifsc_code, razorpay_payout_id, utr_number, created_at
)
VALUES
  ('b-seed-700000', 'KS-2026-700000', 'Rajesh Sharma', '9825100100', '10020030100', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Wheat', 'Lokwan Golden', 250, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '10 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'AM-001', 'AM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Sale Completed', 250, 25, 6250, 'Online', 'Paid', '10 September 2026', 'PAY-800000', 'State Bank of India', '309820000100', 'SBIN0001234', 'pout_seed_800000', 'UTR20260910800000', NOW() - INTERVAL '2 days'),
  ('b-seed-700001', 'KS-2026-700001', 'Bhavesh Patel', '9825100101', '10020030101', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 297, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '11 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Sale Completed', 297, 68, 20196, 'Cash', 'Paid', '11 September 2026', 'CASH-VCHR-800001', 'Bank of Baroda', '309820000101', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('b-seed-700002', 'KS-2026-700002', 'Mansukh Bhai', '9825100102', '10020030102', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Rice', 'Basmati Super', 344, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '12 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Sale Completed', 344, 32, 11008, 'Online', 'Paid', '12 September 2026', 'PAY-800002', 'HDFC Bank', '309820000102', 'HDFC0000123', 'pout_seed_800002', 'UTR20260910800002', NOW() - INTERVAL '2 days'),
  ('b-seed-700003', 'KS-2026-700003', 'Vikram Singh', '9825100103', '10020030103', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Groundnut', 'GG-20 Bold', 391, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '13 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Sale Completed', 391, 58, 22678, 'Cash', 'Paid', '13 September 2026', 'CASH-VCHR-800003', 'Punjab National Bank', '309820000103', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('b-seed-700004', 'KS-2026-700004', 'Arvind Rathod', '9825100104', '10020030104', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Maize', 'African Tall Hybrid', 438, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '14 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'AM-001', 'AM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Sale Completed', 438, 22, 9636, 'Online', 'Paid', '14 September 2026', 'PAY-800004', 'State Bank of India', '309820000104', 'SBIN0001234', 'pout_seed_800004', 'UTR20260910800004', NOW() - INTERVAL '2 days'),
  ('b-seed-700005', 'KS-2026-700005', 'Dinesh Kumar', '9825100105', '10020030105', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 485, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '10 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Sale Completed', 485, 24, 11640, 'Cash', 'Paid', '10 September 2026', 'CASH-VCHR-800005', 'Bank of Baroda', '309820000105', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('b-seed-700006', 'KS-2026-700006', 'Suresh Bhai', '9825100106', '10020030106', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 532, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '11 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Weighed', 532, 52, 27664, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000106', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700007', 'KS-2026-700007', 'Harish Chandra', '9825100107', '10020030107', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Wheat', 'Lokwan Golden', 579, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '12 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Weighed', 579, 25, 14475, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000107', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700008', 'KS-2026-700008', 'Kishan Lal', '9825100108', '10020030108', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 626, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '13 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'AM-001', 'AM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Weighed', 626, 68, 42568, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000108', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700009', 'KS-2026-700009', 'Gopal Das', '9825100109', '10020030109', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Rice', 'Basmati Super', 673, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '14 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Weighed', 673, 32, 21536, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000109', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700010', 'KS-2026-700010', 'Pravin Bhai', '9825100110', '10020030110', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Groundnut', 'GG-20 Bold', 720, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '10 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Weighed', 720, 58, 41760, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000110', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700011', 'KS-2026-700011', 'Mahesh Verma', '9825100111', '10020030111', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Maize', 'African Tall Hybrid', 767, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '11 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Crop Verified', 767, 22, 16874, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000111', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700012', 'KS-2026-700012', 'Jitendra Dave', '9825100112', '10020030112', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 814, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '12 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'AM-001', 'AM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Crop Verified', 814, 24, 19536, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000112', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700013', 'KS-2026-700013', 'Raju Bhai', '9825100113', '10020030113', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 861, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '13 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Crop Verified', 861, 52, 44772, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000113', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700014', 'KS-2026-700014', 'Naresh Patel', '9825100114', '10020030114', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Wheat', 'Lokwan Golden', 908, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '14 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Crop Verified', 908, 25, 22700, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000114', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700015', 'KS-2026-700015', 'Ashok Singh', '9825100115', '10020030115', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 955, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '10 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Crop Verified', 955, 68, 64940, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000115', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700016', 'KS-2026-700016', 'Vinod Yadav', '9825100116', '10020030116', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Rice', 'Basmati Super', 1002, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '11 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'AM-001', 'AM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Arrived', 1002, 32, 32064, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000116', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700017', 'KS-2026-700017', 'Kantilal Shah', '9825100117', '10020030117', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Groundnut', 'GG-20 Bold', 1049, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '12 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Arrived', 1049, 58, 60842, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000117', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700018', 'KS-2026-700018', 'Mukesh Parmar', '9825100118', '10020030118', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Maize', 'African Tall Hybrid', 1096, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '13 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Arrived', 1096, 22, 24112, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000118', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700019', 'KS-2026-700019', 'Bharat Bhai', '9825100119', '10020030119', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 1143, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '14 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'AM-001', 'AM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Arrived', 1143, 24, 27432, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000119', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700020', 'KS-2026-700020', 'Sunil Chaudhary', '9825100120', '10020030120', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 1190, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '10 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 2, 'AM-002', 'AM-002', 2, 1, 30, '08:15 AM', '08:05 AM', '08:10 AM', 15, 1, 'Booked', 1190, 52, 61880, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000120', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700021', 'KS-2026-700021', 'Govind Bhai', '9825100121', '10020030121', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Wheat', 'Lokwan Golden', 1237, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '11 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 2, 'AM-002', 'AM-002', 2, 1, 30, '10:15 AM', '10:05 AM', '10:10 AM', 15, 1, 'Booked', 1237, 25, 30925, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000121', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700022', 'KS-2026-700022', 'Dilip Solanki', '9825100122', '10020030122', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 1284, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '12 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 2, 'AM-002', 'AM-002', 2, 1, 30, '12:15 PM', '12:05 PM', '12:10 PM', 15, 1, 'Booked', 1284, 68, 87312, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000122', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700023', 'KS-2026-700023', 'Jayesh Joshi', '9825100123', '10020030123', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Rice', 'Basmati Super', 1331, 'kg', 'apmc-main', 'APMC Mandi Main Yard', 'APMC Mandi Main Yard', '13 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 2, 'AM-002', 'AM-002', 2, 1, 30, '02:15 PM', '02:05 PM', '02:10 PM', 15, 1, 'Booked', 1331, 32, 42592, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000123', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '2 hours'),

  -- 20 slots for district-hub
  ('b-seed-700024', 'KS-2026-700024', 'Ramesh Chandra', '9825100124', '10020030124', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Groundnut', 'GG-20 Bold', 250, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '10 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'DH-001', 'DH-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Sale Completed', 250, 58, 14500, 'Online', 'Paid', '10 September 2026', 'PAY-800024', 'State Bank of India', '309820000124', 'SBIN0001234', 'pout_seed_800024', 'UTR20260910800024', NOW() - INTERVAL '2 days'),
  ('b-seed-700025', 'KS-2026-700025', 'Paresh Patel', '9825100125', '10020030125', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Maize', 'African Tall Hybrid', 297, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '11 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Sale Completed', 297, 22, 6534, 'Cash', 'Paid', '11 September 2026', 'CASH-VCHR-800025', 'Bank of Baroda', '309820000125', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('b-seed-700026', 'KS-2026-700026', 'Chirag Dave', '9825100126', '10020030126', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 344, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '12 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Sale Completed', 344, 24, 8256, 'Online', 'Paid', '12 September 2026', 'PAY-800026', 'HDFC Bank', '309820000126', 'HDFC0000123', 'pout_seed_800026', 'UTR20260910800026', NOW() - INTERVAL '2 days'),
  ('b-seed-700027', 'KS-2026-700027', 'Anil Sharma', '9825100127', '10020030127', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 391, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '13 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Sale Completed', 391, 52, 20332, 'Cash', 'Paid', '13 September 2026', 'CASH-VCHR-800027', 'Punjab National Bank', '309820000127', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('b-seed-700028', 'KS-2026-700028', 'Lalit Kumar', '9825100128', '10020030128', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Wheat', 'Lokwan Golden', 438, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '14 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'DH-001', 'DH-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Weighed', 438, 25, 10950, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000128', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700029', 'KS-2026-700029', 'Deepak Chauhan', '9825100129', '10020030129', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 485, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '10 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Weighed', 485, 68, 32980, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000129', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700030', 'KS-2026-700030', 'Bipin Patel', '9825100130', '10020030130', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Rice', 'Basmati Super', 532, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '11 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Weighed', 532, 32, 17024, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000130', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700031', 'KS-2026-700031', 'Sanjay Yadav', '9825100131', '10020030131', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Groundnut', 'GG-20 Bold', 579, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '12 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Weighed', 579, 58, 33582, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000131', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('b-seed-700032', 'KS-2026-700032', 'Kamlesh Verma', '9825100132', '10020030132', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Maize', 'African Tall Hybrid', 626, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '13 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'DH-001', 'DH-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Crop Verified', 626, 22, 13772, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000132', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700033', 'KS-2026-700033', 'Pankaj Shah', '9825100133', '10020030133', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 673, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '14 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Crop Verified', 673, 24, 16152, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000133', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700034', 'KS-2026-700034', 'Vipul Solanki', '9825100134', '10020030134', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 720, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '10 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Crop Verified', 720, 52, 37440, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000134', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700035', 'KS-2026-700035', 'Hitesh Parmar', '9825100135', '10020030135', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Wheat', 'Lokwan Golden', 767, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '11 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Crop Verified', 767, 25, 19175, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000135', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700036', 'KS-2026-700036', 'Amrit Bhai', '9825100136', '10020030136', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 814, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '12 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'DH-001', 'DH-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Arrived', 814, 68, 55352, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000136', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700037', 'KS-2026-700037', 'Nitin Joshi', '9825100137', '10020030137', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Rice', 'Basmati Super', 861, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '13 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Arrived', 861, 32, 27552, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000137', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700038', 'KS-2026-700038', 'Vijay Rathod', '9825100138', '10020030138', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Groundnut', 'GG-20 Bold', 908, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '14 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Arrived', 908, 58, 52664, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000138', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700039', 'KS-2026-700039', 'Prakash Patel', '9825100139', '10020030139', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Maize', 'African Tall Hybrid', 955, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '10 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'DH-001', 'DH-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Arrived', 955, 22, 21010, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000139', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700040', 'KS-2026-700040', 'Tarun Kumar', '9825100140', '10020030140', 'Anandpur', 'Petlad', 'Anand', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 1002, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '11 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 2, 'DH-002', 'DH-002', 2, 1, 30, '08:15 AM', '08:05 AM', '08:10 AM', 15, 1, 'Booked', 1002, 24, 24048, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000140', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700041', 'KS-2026-700041', 'Rohit Singh', '9825100141', '10020030141', 'Sanand', 'Sanand', 'Ahmedabad', 'Gujarat', 'Mustard', 'Pusa Bold Yellow', 1049, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '12 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 2, 'DH-002', 'DH-002', 2, 1, 30, '10:15 AM', '10:05 AM', '10:10 AM', 15, 1, 'Booked', 1049, 52, 54548, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000141', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700042', 'KS-2026-700042', 'Manish Dave', '9825100142', '10020030142', 'Borsad', 'Borsad', 'Anand', 'Gujarat', 'Wheat', 'Lokwan Golden', 1096, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '13 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 2, 'DH-002', 'DH-002', 2, 1, 30, '12:15 PM', '12:05 PM', '12:10 PM', 15, 1, 'Booked', 1096, 25, 27400, 'Online', 'Pending', NULL, NULL, 'HDFC Bank', '309820000142', 'HDFC0000123', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('b-seed-700043', 'KS-2026-700043', 'Kishore Sharma', '9825100143', '10020030143', 'Morbi', 'Morbi', 'Morbi', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 1143, 'kg', 'district-hub', 'District Procurement Hub', 'District Procurement Hub', '14 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 2, 'DH-002', 'DH-002', 2, 1, 30, '02:15 PM', '02:05 PM', '02:10 PM', 15, 1, 'Booked', 1143, 68, 77724, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000143', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '2 hours'),

  -- 3 slots for kvk (Kisan Vikas Kendra)
  ('b-seed-700044', 'KS-2026-700044', 'Ajay Verma', '9825100144', '10020030144', 'Kheda', 'Matar', 'Kheda', 'Gujarat', 'Rice', 'Basmati Super', 450, 'kg', 'kvk', 'Kisan Vikas Kendra', 'Kisan Vikas Kendra', '10 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'KV-001', 'KV-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Crop Verified', 450, 32, 14400, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000144', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '12 hours'),
  ('b-seed-700045', 'KS-2026-700045', 'Haresh Patel', '9825100145', '10020030145', 'Bardoli', 'Bardoli', 'Surat', 'Gujarat', 'Groundnut', 'GG-20 Bold', 380, 'kg', 'kvk', 'Kisan Vikas Kendra', 'Kisan Vikas Kendra', '11 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'KV-001', 'KV-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Booked', 380, 58, 22040, 'Cash', 'Pending', NULL, NULL, 'Bank of Baroda', '309820000145', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '6 hours'),
  ('b-seed-700046', 'KS-2026-700046', 'Ghanshyam Das', '9825100146', '10020030146', 'Mehsana', 'Mehsana', 'Mehsana', 'Gujarat', 'Wheat', 'Lokwan Golden', 520, 'kg', 'kvk', 'Kisan Vikas Kendra', 'Kisan Vikas Kendra', '12 September 2026', 'session-3', '12:00 PM', '02:00 PM', '12:00 PM - 02:00 PM', 1, 'KV-001', 'KV-001', 1, 0, 15, '12:00 PM', '12:00 PM', '12:00 PM', 15, 1, 'Sale Completed', 520, 25, 13000, 'Online', 'Paid', '12 September 2026', 'PAY-800046', 'HDFC Bank', '309820000146', 'HDFC0000123', 'pout_seed_800046', 'UTR20260910800046', NOW() - INTERVAL '2 days'),

  -- 3 slots for taluka-mandi (Taluka Mandi Centre)
  ('b-seed-700047', 'KS-2026-700047', 'Sandip Solanki', '9825100147', '10020030147', 'Dholka', 'Dholka', 'Ahmedabad', 'Gujarat', 'Cotton', 'Bt-Cotton Shanker-6', 610, 'kg', 'taluka-mandi', 'Taluka Mandi Centre', 'Taluka Mandi Centre', '10 September 2026', 'session-2', '10:00 AM', '12:00 PM', '10:00 AM - 12:00 PM', 1, 'TM-001', 'TM-001', 1, 0, 15, '10:00 AM', '10:00 AM', '10:00 AM', 15, 1, 'Arrived', 610, 68, 41480, 'Cash', 'Pending', NULL, NULL, 'Punjab National Bank', '309820000147', 'PUNB0123400', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('b-seed-700048', 'KS-2026-700048', 'Nilesh Parmar', '9825100148', '10020030148', 'Nadiad', 'Nadiad', 'Kheda', 'Gujarat', 'Bajra', 'Hybrid Super Bajra', 390, 'kg', 'taluka-mandi', 'Taluka Mandi Centre', 'Taluka Mandi Centre', '11 September 2026', 'session-1', '08:00 AM', '10:00 AM', '08:00 AM - 10:00 AM', 1, 'TM-001', 'TM-001', 1, 0, 15, '08:00 AM', '08:00 AM', '08:00 AM', 15, 1, 'Booked', 390, 24, 9360, 'Online', 'Pending', NULL, NULL, 'State Bank of India', '309820000148', 'SBIN0001234', NULL, NULL, NOW() - INTERVAL '6 hours'),
  ('b-seed-700049', 'KS-2026-700049', 'Chetan Shah', '9825100149', '10020030149', 'Godhra', 'Godhra', 'Panchmahal', 'Gujarat', 'Maize', 'African Tall Hybrid', 440, 'kg', 'taluka-mandi', 'Taluka Mandi Centre', 'Taluka Mandi Centre', '13 September 2026', 'session-4', '02:00 PM', '04:00 PM', '02:00 PM - 04:00 PM', 1, 'TM-001', 'TM-001', 1, 0, 15, '02:00 PM', '02:00 PM', '02:00 PM', 15, 1, 'Sale Completed', 440, 22, 9680, 'Cash', 'Paid', '13 September 2026', 'CASH-VCHR-800049', 'Bank of Baroda', '309820000149', 'BARB0ANANDX', NULL, NULL, NOW() - INTERVAL '2 days')
ON CONFLICT (selling_id) DO UPDATE SET
  status = EXCLUDED.status,
  final_quantity = EXCLUDED.final_quantity,
  approved_rate = EXCLUDED.approved_rate,
  total_amount = EXCLUDED.total_amount,
  payment_status = EXCLUDED.payment_status,
  payment_date = EXCLUDED.payment_date,
  utr_number = EXCLUDED.utr_number;

-- =====================================================================
-- 14. SEED DATASET: NOTIFICATIONS
-- =====================================================================
INSERT INTO notifications (id, mobile_number, title, message, date, read)
VALUES
  ('notif-1', '9876543210', 'Welcome to KisanX Portal', 'Your farmer account is active. Use your 11-digit card for procurement slots.', 'Just now', false),
  ('notif-2', '9825100100', 'Payment Disbursed: ₹6,250', 'DBT transfer settled for Selling ID KS-2026-700000. UTR: UTR20260910800000.', 'Just now', false),
  ('notif-3', '9825100102', 'Payment Disbursed: ₹11,008', 'DBT transfer settled for Selling ID KS-2026-700002. UTR: UTR20260910800002.', 'Just now', false)
ON CONFLICT (id) DO NOTHING;
