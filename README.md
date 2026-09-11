# KisanX - Smart APMC Mandi Procurement & Farmer Queue Portal

KisanX is an intelligent APMC mandi procurement and queue orchestration platform designed to streamline agricultural crop sales, eliminate mandi overcrowding, digitize farmer dossiers, and automate Direct Benefit Transfer (DBT) disbursements.

---

## 🚀 Key Features

### 👨‍🌾 1. Farmer Portal
- **Fast Authentication**: Clean login with 11-digit Farmer Registration Card and 10-digit mobile number.
- **Smart Slot Booking**: Intelligent multi-centre procurement slot scheduling with real-time arrival estimates.
- **Gate Booking Pass**: Official digital booking slip with dynamic token number and QR-style representation.
- **DBT Banking & Profile**: Linked bank details for instant payouts via Direct Benefit Transfer.
- **Multi-language Support**: English, Hindi, and Gujarati localization.

### 🏢 2. Admin & Yard Control Centre
- **Interactive Control Room**: Live counter token advancement and throughput tracking across 4 Mandi centres:
  - APMC Mandi Main Yard (AM)
  - District Procurement Hub (DH)
  - Kisan Vikas Kendra (KV)
  - Taluka Mandi Centre (TM)
- **👨‍🌾 Master Farmer Database (15 Fields)**:
  - Complete master farmer directory with ID Card No, Mobile, Name, Village, Taluka, District, State, Address, Payment Mode, Account Holder, Bank Name, Account Number, IFSC Code, Created At, and Updated At.
  - Live search, filtering by district/payment mode, and CSV export.
  - Official Farmer Dossier modal.
- **📋 Mandi Booking Database**:
  - Full visibility into all procurement bookings, physical weighments, rates, and settlement slips.
  - Search by Selling ID, farmer name, crop, and status with CSV export.
- **Instant Search**: Lookup any farmer or slot by 9-digit Selling ID (`KS-2026-...`).

### 🗄️ 3. Backend & SQLite Database Engine
- Built with **Node.js Express** and Node's high-performance native `node:sqlite` (`DatabaseSync`) driver.
- Persistent database stored in `server/kisanx.db` running in WAL (Write-Ahead Logging) mode.
- REST API for bookings, queue status, farmer profiles, bank accounts, and statistics.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite 5, Vanilla CSS Design System, Lucide Icons
- **Backend**: Node.js v25, Express.js v5
- **Database**: SQLite 3 (native `node:sqlite`)
- **API Communication**: Vite proxy routing `/api` $\rightarrow$ `http://localhost:5000`

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher, v22+ recommended for native SQLite)
- npm

### 1. Installation
```bash
git clone https://github.com/AvinashCSE4/kisanX.git
cd kisanX
npm install
```

### 2. Run Backend Server (Port 5000)
```bash
node server/index.js
```

### 3. Run Frontend Development Server (Port 5173)
In a separate terminal:
```bash
npm run dev
```

### 4. Open in Browser
- **Farmer Portal**: [http://localhost:5173/](http://localhost:5173/)
- **Fresh Customer Session**: [http://localhost:5173/#new-customer](http://localhost:5173/#new-customer)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Credentials
- **Farmer ID Card**: `10020030040`
- **Mobile Number**: `9876543210`
- **Demo OTP**: `123456`
- **Admin Portal**: Accessible via "Admin Login" in the portal footer or top-right profile icon.

---

## 📄 License
MIT License
