import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateSellingId, generatePaymentId } from '../utils/idGenerator';
import { calculateQueueTimes } from '../utils/queueCalculator';
import {
  CENTRES_CONFIG,
  SESSIONS_CONFIG,
  getCentreConfig,
  getSessionConfig,
  getQueueKey,
  generateCentreToken,
  calculateCentreLoad,
  calculateSessionQueue,
  calculateEstimatedWaitTime,
  calculateRecommendedArrivalTime,
  getSmartSlotRecommendation,
  findMissedSlotRecoveryOptions
} from '../utils/smartQueueEngine';

import { generate50SeedBookings } from '../data/initialBookings';
import api from '../services/api';
import supabaseService from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const PortalDataContext = createContext();

// Initial state for new customer profile starts clean
const INITIAL_FARMER_PROFILE = {
  fullName: '',
  farmerIdCard: '',
  mobileNumber: '',
  village: '',
  taluka: '',
  district: '',
  state: '',
  address: '',
  preferredPaymentMode: 'Online' // 'Online' | 'Cash'
};

const INITIAL_BANK_DETAILS = {
  accountHolder: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  preferredPaymentMode: 'Online' // 'Online' | 'Cash'
};

// Seed bookings across 4 centres, 5 dates, and 4 sessions
const INITIAL_BOOKINGS = generate50SeedBookings();
const SEED_DATA_KEY = 'kisan_smart_v4_3slots';

export const PortalDataProvider = ({ children }) => {
  // Farmer session
  const [isFarmerLoggedIn, setIsFarmerLoggedIn] = useState(false);
  const [farmerMobile, setFarmerMobile] = useState('');

  // Admin session
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Active view mode for top level: 'farmer' | 'admin'
  const [activePortal, setActivePortal] = useState('farmer');

  // Backend connection status
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Farmer profile - starts empty
  const [farmerProfile, setFarmerProfile] = useState(() => {
    const saved = localStorage.getItem('kisan_farmer_profile');
    return saved ? JSON.parse(saved) : INITIAL_FARMER_PROFILE;
  });

  // Bank details - starts empty
  const [bankDetails, setBankDetails] = useState(() => {
    const saved = localStorage.getItem('kisan_bank_details');
    return saved ? JSON.parse(saved) : INITIAL_BANK_DETAILS;
  });

  // All bookings list
  const [bookings, setBookings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kisan_bookings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error('Error parsing saved bookings', e);
        }
      }
    }
    return [];
  });

  // Real-time queue tracker - currently served token per centre+date+session or slot
  const [liveServingTokens, setLiveServingTokens] = useState(() => {
    return {
      '08:00 AM - 10:00 AM': 1,
      '10:00 AM - 12:00 PM': 1,
      '12:00 PM - 02:00 PM': 1,
      '02:00 PM - 04:00 PM': 1,
      '09:00 AM - 11:00 AM': 1,
      '11:00 AM - 01:00 PM': 1,
      '04:00 PM - 06:00 PM': 1
    };
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Fetch initial data from SQLite backend on startup
  useEffect(() => {
    let isMounted = true;

    const initializeDataFromBackend = async () => {
      try {
        const health = await api.checkHealth();
        if (!health) return;

        if (isMounted) {
          setIsBackendConnected(true);
        }

        const [bookingsRes, queuesRes, notifsRes] = await Promise.all([
          api.getBookings(),
          api.getLiveQueues(),
          api.getNotifications()
        ]);

        if (!isMounted) return;

        if (bookingsRes?.success && Array.isArray(bookingsRes.data)) {
          setBookings(bookingsRes.data);
          localStorage.setItem('kisan_bookings', JSON.stringify(bookingsRes.data));
        }

        if (queuesRes?.success && queuesRes.data) {
          setLiveServingTokens(prev => ({ ...prev, ...queuesRes.data }));
        }

        if (notifsRes?.success && Array.isArray(notifsRes.data)) {
          setNotifications(notifsRes.data);
        }

        // If Supabase is configured and farmer mobile is set, ensure profile & bank are refreshed from Supabase
        if (isSupabaseConfigured() && farmerMobile) {
          const farmerRes = await api.getFarmer(farmerMobile);
          if (farmerRes?.success && farmerRes.data) {
            setFarmerProfile({
              fullName: farmerRes.data.fullName,
              farmerIdCard: farmerRes.data.farmerIdCard,
              mobileNumber: farmerRes.data.mobileNumber,
              village: farmerRes.data.village,
              taluka: farmerRes.data.taluka,
              district: farmerRes.data.district,
              state: farmerRes.data.state,
              address: farmerRes.data.address,
              preferredPaymentMode: farmerRes.data.preferredPaymentMode
            });
            setBankDetails({
              accountHolder: farmerRes.data.accountHolder,
              bankName: farmerRes.data.bankName,
              accountNumber: farmerRes.data.accountNumber,
              ifscCode: farmerRes.data.ifscCode,
              preferredPaymentMode: farmerRes.data.preferredPaymentMode
            });
          }
        }
      } catch (err) {
        console.warn('Backend fetch during mount failed, continuing with local data:', err);
      }
    };

    initializeDataFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('kisan_farmer_logged', String(isFarmerLoggedIn));
    localStorage.setItem('kisan_farmer_mobile', farmerMobile);
    localStorage.setItem('kisan_admin_logged', String(isAdminLoggedIn));
    localStorage.setItem('kisan_active_portal', activePortal);
    localStorage.setItem('kisan_farmer_profile', JSON.stringify(farmerProfile));
    localStorage.setItem('kisan_bank_details', JSON.stringify(bankDetails));
    localStorage.setItem('kisan_bookings', JSON.stringify(bookings));
  }, [isFarmerLoggedIn, farmerMobile, isAdminLoggedIn, activePortal, farmerProfile, bankDetails, bookings]);

  // Helper to retrieve live serving token for a specific centre, date, session
  const getLiveServingToken = (centreId, date, sessionId) => {
    const key = getQueueKey(centreId, date, sessionId);
    if (liveServingTokens[key] !== undefined) {
      return liveServingTokens[key];
    }
    const session = getSessionConfig(sessionId);
    if (liveServingTokens[session.time] !== undefined) {
      return liveServingTokens[session.time];
    }
    return 1;
  };

  // Advance queue token for specific Centre + Date + Session (Admin action)
  const advanceCentreQueueToken = (centreId, date, sessionId) => {
    const key = getQueueKey(centreId, date, sessionId);
    setLiveServingTokens(prev => {
      const curr = prev[key] || 1;
      return {
        ...prev,
        [key]: Math.min(8, curr + 1)
      };
    });

    // Sync to backend SQLite
    api.advanceQueue({ centreId, date, sessionId }).catch(err => {
      console.warn('Failed to sync queue advance to backend:', err);
    });
  };

  // Backwards-compatible advanceQueueToken
  const advanceQueueToken = (timeSlotOrKey) => {
    setLiveServingTokens(prev => ({
      ...prev,
      [timeSlotOrKey]: Math.min(30, (prev[timeSlotOrKey] || 1) + 1)
    }));

    api.advanceQueue({ queueKey: timeSlotOrKey }).catch(err => {
      console.warn('Failed to sync queue advance to backend:', err);
    });
  };

  // Farmer login with 11-digit Farmer ID Card authentication
  const loginFarmer = async (mobile, idCard = '') => {
    setFarmerMobile(mobile);
    setIsFarmerLoggedIn(true);
    setActivePortal('farmer');

    // Attempt backend login first
    try {
      const res = await api.loginFarmer(mobile, idCard);
      if (res?.success && res.data) {
        if (res.data.profile) {
          setFarmerProfile(res.data.profile);
        }
        if (res.data.bank) {
          setBankDetails(res.data.bank);
        }

        // Fetch user-specific bookings from SQLite database
        const bRes = await api.getBookings();
        if (bRes?.success && Array.isArray(bRes.data)) {
          setBookings(bRes.data);
        }

        // Fetch user-specific notifications
        const nRes = await api.getNotifications(mobile);
        if (nRes?.success && Array.isArray(nRes.data)) {
          setNotifications(nRes.data);
        }
        return;
      }
    } catch (e) {
      console.warn('Backend login unavailable, fallback to local storage:', e);
    }

    // LocalStorage fallback if backend unavailable
    try {
      const savedMap = localStorage.getItem('kisan_profiles_by_mobile');
      const profilesMap = savedMap ? JSON.parse(savedMap) : {};
      if (profilesMap[mobile]) {
        const existingProf = profilesMap[mobile].profile || { ...INITIAL_FARMER_PROFILE, mobileNumber: mobile };
        if (idCard) existingProf.farmerIdCard = idCard;
        setFarmerProfile(existingProf);
        setBankDetails(profilesMap[mobile].bank || INITIAL_BANK_DETAILS);
      } else {
        const freshProfile = { ...INITIAL_FARMER_PROFILE, mobileNumber: mobile, farmerIdCard: idCard || '' };
        setFarmerProfile(freshProfile);
        setBankDetails(INITIAL_BANK_DETAILS);
      }
    } catch (e) {
      setFarmerProfile({ ...INITIAL_FARMER_PROFILE, mobileNumber: mobile, farmerIdCard: idCard || '' });
      setBankDetails(INITIAL_BANK_DETAILS);
    }
  };

  const logoutFarmer = () => {
    setIsFarmerLoggedIn(false);
  };

  // Load login page for a brand new customer while preserving all existing bookings
  const startNewCustomerSession = () => {
    setIsFarmerLoggedIn(false);
    setFarmerMobile('');
    setFarmerProfile(INITIAL_FARMER_PROFILE);
    setBankDetails(INITIAL_BANK_DETAILS);
    setActivePortal('farmer');
    localStorage.removeItem('kisan_farmer_logged');
    localStorage.removeItem('kisan_farmer_mobile');
    localStorage.removeItem('kisan_farmer_profile');
    localStorage.removeItem('kisan_bank_details');
  };

  // Reset all data in SQLite and localStorage
  const resetTo3BookingsPerSession = async () => {
    localStorage.removeItem('kisan_farmer_logged');
    localStorage.removeItem('kisan_farmer_mobile');
    localStorage.removeItem('kisan_farmer_profile');
    localStorage.removeItem('kisan_bank_details');
    localStorage.removeItem('kisan_profiles_by_mobile');

    try {
      if (supabaseService.isConfigured()) {
        await supabaseService.seedDemoData();
      } else {
        await api.resetDatabase();
      }
      const freshRes = await api.getBookings();
      if (freshRes?.success && Array.isArray(freshRes.data)) {
        setBookings(freshRes.data);
      }
      const freshQueues = await api.getLiveQueues();
      if (freshQueues?.success && freshQueues.data) {
        setLiveServingTokens(freshQueues.data);
      }
    } catch (e) {
      console.warn('Backend reset failed, using local reset:', e);
      const fresh = generate50SeedBookings();
      setBookings(fresh);
      localStorage.setItem('kisan_bookings', JSON.stringify(fresh));
    }

    setIsFarmerLoggedIn(false);
    setFarmerMobile('');
    setFarmerProfile(INITIAL_FARMER_PROFILE);
    setBankDetails(INITIAL_BANK_DETAILS);
    setActivePortal('farmer');
  };

  // Completely wipe all old data from SQLite and localStorage
  const clearAllPortalData = async () => {
    localStorage.removeItem('kisan_farmer_logged');
    localStorage.removeItem('kisan_farmer_mobile');
    localStorage.removeItem('kisan_farmer_profile');
    localStorage.removeItem('kisan_bank_details');
    localStorage.removeItem('kisan_profiles_by_mobile');
    localStorage.setItem('kisan_bookings', JSON.stringify([]));

    try {
      await api.clearAllData();
    } catch (e) {
      console.warn('Backend clear failed, continuing with local wipe:', e);
    }

    setBookings([]);
    setNotifications([]);
    setIsFarmerLoggedIn(false);
    setFarmerMobile('');
    setFarmerProfile(INITIAL_FARMER_PROFILE);
    setBankDetails(INITIAL_BANK_DETAILS);
  };

  // Support direct URL link (e.g. http://localhost:5173/#new-customer)
  useEffect(() => {
    const handleUrlCheck = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash === '#new-customer' || search.includes('new_customer') || search.includes('login=new')) {
          startNewCustomerSession();
        }
      }
    };
    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    return () => window.removeEventListener('hashchange', handleUrlCheck);
  }, []);

  // Admin login
  const loginAdmin = () => {
    setIsAdminLoggedIn(true);
    setActivePortal('admin');
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
  };

  // Switch portal explicitly
  const switchPortal = (mode) => {
    setActivePortal(mode);
  };

  // Update farmer profile
  const updateFarmerProfile = (updated) => {
    setFarmerProfile(prev => {
      const next = { ...prev, ...updated };
      if (farmerMobile) {
        // Sync to backend SQLite
        api.updateFarmerProfile(farmerMobile, next).catch(err => {
          console.warn('Failed to sync profile update to backend:', err);
        });

        try {
          const savedMap = localStorage.getItem('kisan_profiles_by_mobile');
          const profilesMap = savedMap ? JSON.parse(savedMap) : {};
          profilesMap[farmerMobile] = { ...(profilesMap[farmerMobile] || {}), profile: next };
          localStorage.setItem('kisan_profiles_by_mobile', JSON.stringify(profilesMap));
        } catch (e) {}
      }
      return next;
    });
  };

  // Update bank details
  const updateBankDetails = (updated) => {
    setBankDetails(prev => {
      const next = { ...prev, ...updated };
      if (farmerMobile) {
        // Sync to backend SQLite
        api.updateBankDetails(farmerMobile, next).catch(err => {
          console.warn('Failed to sync bank details to backend:', err);
        });

        try {
          const savedMap = localStorage.getItem('kisan_profiles_by_mobile');
          const profilesMap = savedMap ? JSON.parse(savedMap) : {};
          profilesMap[farmerMobile] = { ...(profilesMap[farmerMobile] || {}), bank: next };
          localStorage.setItem('kisan_profiles_by_mobile', JSON.stringify(profilesMap));
        } catch (e) {}
      }
      return next;
    });
  };

  // Farmer's personal bookings (strictly isolated to the logged-in mobile number)
  const farmerBookings = (bookings || []).filter(b => b.mobileNumber === farmerMobile);

  // Add new booking with centre-specific token, 15-minute turns & dynamic arrival time
  const createBooking = async (bookingData) => {
    const sellingId = generateSellingId();
    const targetDate = bookingData.date || '10 September 2026';
    
    // Resolve centre and session
    const centre = getCentreConfig(bookingData.centreId || bookingData.centre);
    const session = getSessionConfig(bookingData.sessionId || bookingData.timeSlot);

    // Filter existing bookings in this specific centre + date + session
    const existingInSession = bookings.filter(b => {
      const matchCentre = (b.centreId === centre.id) || (b.centre && b.centre.toLowerCase().includes(centre.name.toLowerCase()));
      const matchDate = b.date === targetDate;
      const matchSession = (b.sessionId === session.id) || (b.timeSlot && b.timeSlot.includes(session.time));
      const notCancelled = b.status !== 'Cancelled' && b.status !== 'Rescheduled';
      return matchCentre && matchDate && matchSession && notCancelled;
    });

    const tokenIndex = Math.min(8, existingInSession.length + 1);
    const centreToken = generateCentreToken(centre.id, tokenIndex);
    const estimatedWaitMinutes = calculateEstimatedWaitTime(tokenIndex);
    const arrivalInfo = calculateRecommendedArrivalTime(session.startTime, tokenIndex);

    const newBookingPayload = {
      id: 'b-' + Date.now(),
      sellingId,
      farmerName: farmerProfile.fullName || 'Farmer',
      mobileNumber: farmerProfile.mobileNumber || farmerMobile,
      farmerIdCard: farmerProfile.farmerIdCard || '10020030040',
      village: farmerProfile.village || '',
      taluka: farmerProfile.taluka || '',
      district: farmerProfile.district || '',
      state: farmerProfile.state || '',
      crop: bookingData.crop,
      variety: bookingData.variety || 'Standard',
      quantity: Number(bookingData.quantity) || 100,
      unit: bookingData.unit || 'kg',
      centreId: centre.id,
      centre: centre.name,
      date: targetDate,
      sessionId: session.id,
      timeSlot: session.time,
      centreToken,
      tokenNumber: tokenIndex,
      membersAhead: Math.max(0, tokenIndex - 1),
      estimatedWaitMinutes,
      estimatedTurnTime: arrivalInfo.turnTime,
      recommendedArrivalTime: arrivalInfo.recommendedArrival,
      reportGateTime: arrivalInfo.recommendedArrival,
      status: 'Booked',
      finalQuantity: Number(bookingData.quantity) || 100,
      approvedRate: 25,
      totalAmount: (Number(bookingData.quantity) || 100) * 25,
      paymentMode: bookingData.paymentMode || farmerProfile.preferredPaymentMode || 'Online',
      paymentStatus: 'Pending',
      paymentDate: '',
      paymentId: '',
      bankName: bankDetails.bankName || 'Registered Bank',
      accountNumber: bankDetails.accountNumber || '',
      ifscCode: bankDetails.ifscCode || '',
      createdAt: new Date().toISOString()
    };

    // Optimistically update local state
    setBookings(prev => [newBookingPayload, ...prev]);

    // Add notifications
    setNotifications(prev => [
      {
        id: 'n-' + Date.now(),
        title: `Slot Booked: ${sellingId} (${centreToken})`,
        message: `${bookingData.crop} booked at ${centre.name} for ${targetDate} (${session.time}). Token: ${centreToken}. Turn: ${arrivalInfo.turnTime}. Recommended Arrival: ${arrivalInfo.recommendedArrival}. Payment: ${newBookingPayload.paymentMode === 'Cash' ? 'Cash at Counter' : 'Online DBT'}.`,
        date: 'Just now',
        read: false
      },
      {
        id: 'n-5min-' + Date.now(),
        title: `5-Min Session Reminder: ${centreToken}`,
        message: `Your procurement session for ${bookingData.crop} at ${centre.name} starts in 5 minutes! Please be present near the verification gate by ${arrivalInfo.recommendedArrival}.`,
        date: '5 min reminder',
        read: false
      },
      ...prev
    ]);

    // Send to backend SQLite
    try {
      const res = await api.createBooking(newBookingPayload);
      if (res?.success && res.data) {
        setBookings(prev => prev.map(b => (b.id === newBookingPayload.id ? res.data : b)));
        return res.data;
      }
    } catch (e) {
      console.warn('Backend booking sync failed, kept in local state:', e);
    }

    return newBookingPayload;
  };

  // Reschedule a missed booking to a new centre / session without duplicate active bookings
  const rescheduleMissedBooking = async (originalSellingId, newCentreId, newDate, newSessionId) => {
    const originalBooking = bookings.find(b => b.sellingId === originalSellingId);
    if (!originalBooking) return null;

    // Mark original booking as Missed (Rebooked)
    setBookings(prev =>
      prev.map(b => (b.sellingId === originalSellingId ? { ...b, status: 'Missed (Rebooked)' } : b))
    );

    // Create new booking with original crop/quantity details but new centre/session
    const rebooked = await createBooking({
      crop: originalBooking.crop,
      variety: originalBooking.variety,
      quantity: originalBooking.quantity,
      unit: originalBooking.unit,
      paymentMode: originalBooking.paymentMode,
      centreId: newCentreId,
      date: newDate,
      sessionId: newSessionId
    });

    setNotifications(prev => [
      {
        id: 'n-resched-' + Date.now(),
        title: `Missed Slot Rebooked: ${rebooked.sellingId}`,
        message: `Your missed booking ${originalSellingId} has been successfully rescheduled to ${rebooked.centre} on ${rebooked.date} (${rebooked.timeSlot}). New Token: ${rebooked.centreToken}.`,
        date: 'Just now',
        read: false
      },
      ...prev
    ]);

    // Sync to backend SQLite
    api.rescheduleBooking(originalSellingId, { newCentreId, newDate, newSessionId }).catch(err => {
      console.warn('Failed to sync reschedule to backend:', err);
    });

    return rebooked;
  };

  // Mark a booking as missed (Admin or Farmer trigger)
  const markBookingMissed = (sellingId) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.sellingId === sellingId) {
          return { ...b, status: 'Missed' };
        }
        return b;
      })
    );

    const b = bookings.find(x => x.sellingId === sellingId);
    if (b) {
      setNotifications(prev => [
        {
          id: 'n-missed-' + Date.now(),
          title: `Slot Missed: ${sellingId}`,
          message: `You missed your slot for ${b.crop} at ${b.centre}. Use "Missed Slot Recovery" to rebook the next available session quickly.`,
          date: 'Just now',
          read: false
        },
        ...prev
      ]);
    }

    // Sync to backend SQLite
    api.markMissed(sellingId).catch(err => {
      console.warn('Failed to sync missed slot to backend:', err);
    });
  };

  // Advance status in crop selling lifecycle:
  // Booked -> Arrived -> Crop Verified -> Weighed -> Sale Completed
  const updateBookingStatus = (sellingId, newStatus) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.sellingId === sellingId) {
          return { ...b, status: newStatus };
        }
        return b;
      })
    );

    // Sync to backend SQLite
    api.updateBookingStatus(sellingId, newStatus).catch(err => {
      console.warn('Failed to sync status update to backend:', err);
    });
  };

  // Admin process payment disbursement
  const processFarmerPayment = (sellingId, finalQuantity, approvedRate, paymentDetails = {}) => {
    const qty = Number(finalQuantity) || 0;
    const rate = Number(approvedRate) || 0;
    const totalAmount = qty * rate;
    const paymentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let updatedBooking = null;

    setBookings(prev =>
      prev.map(b => {
        if (b.sellingId === sellingId) {
          const isCash = (paymentDetails.paymentMode || b.paymentMode) === 'Cash';
          const defaultPaymentId = isCash ? `CASH-VCHR-${Date.now().toString().slice(-6)}` : generatePaymentId();
          const paymentId = paymentDetails.paymentId || defaultPaymentId;

          updatedBooking = {
            ...b,
            ...paymentDetails,
            finalQuantity: qty,
            approvedRate: rate,
            totalAmount,
            status: 'Sale Completed',
            paymentStatus: 'Paid',
            paymentDate,
            paymentId
          };
          return updatedBooking;
        }
        return b;
      })
    );

    // Add notification for farmer
    if (updatedBooking) {
      const isCash = updatedBooking.paymentMode === 'Cash';
      const isRazorpay = Boolean(updatedBooking.razorpayPayoutId);
      setNotifications(prev => [
        {
          id: 'n-' + Date.now(),
          title: isCash
            ? `Cash Voucher Ready: ₹${totalAmount.toLocaleString('en-IN')}`
            : (isRazorpay ? `Razorpay DBT Disbursed: ₹${totalAmount.toLocaleString('en-IN')}` : `Payment Disbursed: ₹${totalAmount.toLocaleString('en-IN')}`),
          message: isCash
            ? `Cash payout voucher of ₹${totalAmount.toLocaleString('en-IN')} for Selling ID ${sellingId} is ready to collect at the APMC Mandi Cash Counter.`
            : (isRazorpay
                ? `Direct Benefit Transfer (DBT) of ₹${totalAmount.toLocaleString('en-IN')} sent via Razorpay API (Payout ID: ${updatedBooking.razorpayPayoutId}, UTR: ${updatedBooking.utrNumber}) has been credited to your bank account.`
                : `Direct bank transfer (DBT) of ₹${totalAmount.toLocaleString('en-IN')} for Selling ID ${sellingId} has been credited to your bank account.`),
          date: 'Just now',
          read: false
        },
        ...prev
      ]);
    }

    // Sync to backend SQLite
    api.processPayment(sellingId, {
      finalQuantity: qty,
      approvedRate: rate,
      ...paymentDetails
    }).catch(err => {
      console.warn('Failed to sync payment to backend:', err);
    });

    return updatedBooking;
  };

  // Find booking by selling ID
  const findBookingBySellingId = (idToFind) => {
    if (!idToFind) return null;
    const clean = idToFind.trim().toUpperCase();
    return bookings.find(b => b.sellingId && b.sellingId.toUpperCase() === clean);
  };

  return (
    <PortalDataContext.Provider
      value={{
        isFarmerLoggedIn,
        farmerMobile,
        isAdminLoggedIn,
        activePortal,
        isBackendConnected,
        isSupabaseConnected: isSupabaseConfigured(),
        farmerProfile,
        bankDetails,
        bookings,
        farmerBookings,
        notifications,
        loginFarmer,
        logoutFarmer,
        loginAdmin,
        logoutAdmin,
        switchPortal,
        updateFarmerProfile,
        updateBankDetails,
        createBooking,
        updateBookingStatus,
        processFarmerPayment,
        findBookingBySellingId,
        liveServingTokens,
        getLiveServingToken,
        advanceCentreQueueToken,
        advanceQueueToken,
        rescheduleMissedBooking,
        markBookingMissed,
        startNewCustomerSession,
        resetTo3BookingsPerSession,
        clearAllPortalData
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
};

export const usePortalData = () => {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error('usePortalData must be used within a PortalDataProvider');
  }
  return context;
};
