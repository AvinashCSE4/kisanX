import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { generate50SeedBookings } from '../data/initialBookings.js';

/**
 * Helper to map snake_case Supabase booking row to frontend camelCase object
 */
export function rowToBooking(r) {
  if (!r) return null;
  return {
    id: r.id,
    sellingId: r.selling_id,
    farmerName: r.farmer_name,
    mobileNumber: r.mobile_number,
    farmerIdCard: r.farmer_id_card,
    village: r.village || '',
    taluka: r.taluka || '',
    district: r.district || '',
    state: r.state || 'Gujarat',
    crop: r.crop,
    variety: r.variety || 'Standard',
    quantity: Number(r.quantity) || 0,
    unit: r.unit || 'kg',
    centreId: r.centre_id,
    centre: r.centre || r.centre_name || '',
    centreName: r.centre_name || r.centre || '',
    date: r.date,
    sessionId: r.session_id,
    sessionStartTime: r.session_start_time || '',
    sessionEndTime: r.session_end_time || '',
    timeSlot: r.time_slot || '',
    tokenNumber: Number(r.token_number) || 1,
    centreToken: r.centre_token || '',
    queueToken: r.queue_token || r.centre_token || '',
    queuePosition: Number(r.queue_position) || Number(r.token_number) || 1,
    membersAhead: Number(r.members_ahead) || 0,
    estimatedWaitMinutes: Number(r.estimated_wait_minutes) || 15,
    estimatedTurnTime: r.estimated_turn_time || '',
    recommendedArrivalTime: r.recommended_arrival_time || '',
    reportGateTime: r.report_gate_time || r.recommended_arrival_time || '',
    averageProcessingTime: Number(r.average_processing_time) || 15,
    activeCounters: Number(r.active_counters) || 1,
    status: r.status || 'Booked',
    finalQuantity: r.final_quantity !== null && r.final_quantity !== undefined ? Number(r.final_quantity) : Number(r.quantity) || 0,
    approvedRate: r.approved_rate !== null && r.approved_rate !== undefined ? Number(r.approved_rate) : 25,
    totalAmount: r.total_amount !== null && r.total_amount !== undefined ? Number(r.total_amount) : (Number(r.quantity) || 0) * 25,
    paymentMode: r.payment_mode || 'Online',
    paymentStatus: r.payment_status || 'Pending',
    paymentDate: r.payment_date || '',
    paymentId: r.payment_id || '',
    bankName: r.bank_name || '',
    accountNumber: r.account_number || '',
    ifscCode: r.ifsc_code || '',
    razorpayPayoutId: r.razorpay_payout_id || '',
    utrNumber: r.utr_number || '',
    createdAt: r.created_at || new Date().toISOString()
  };
}

/**
 * Helper to map frontend camelCase booking to Supabase snake_case row
 */
export function bookingToRow(b) {
  if (!b) return null;
  return {
    id: b.id || `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    selling_id: b.sellingId,
    farmer_name: b.farmerName || 'Farmer',
    mobile_number: b.mobileNumber,
    farmer_id_card: b.farmerIdCard || '10020030040',
    village: b.village || '',
    taluka: b.taluka || '',
    district: b.district || '',
    state: b.state || 'Gujarat',
    crop: b.crop,
    variety: b.variety || 'Standard',
    quantity: Number(b.quantity) || 100,
    unit: b.unit || 'kg',
    centre_id: b.centreId || 'apmc-main',
    centre: b.centre || '',
    centre_name: b.centre || b.centreName || '',
    date: b.date || '10 September 2026',
    session_id: b.sessionId || 'session-1',
    session_start_time: b.sessionStartTime || '',
    session_end_time: b.sessionEndTime || '',
    time_slot: b.timeSlot || '',
    token_number: Number(b.tokenNumber) || 1,
    centre_token: b.centreToken || '',
    queue_token: b.centreToken || '',
    queue_position: Number(b.queuePosition) || Number(b.tokenNumber) || 1,
    members_ahead: Number(b.membersAhead) || 0,
    estimated_wait_minutes: Number(b.estimatedWaitMinutes) || 15,
    estimated_turn_time: b.estimatedTurnTime || '',
    recommended_arrival_time: b.recommendedArrivalTime || '',
    report_gate_time: b.reportGateTime || b.recommendedArrivalTime || '',
    average_processing_time: Number(b.averageProcessingTime) || 15,
    active_counters: Number(b.activeCounters) || 1,
    status: b.status || 'Booked',
    final_quantity: b.finalQuantity !== undefined ? Number(b.finalQuantity) : Number(b.quantity) || 100,
    approved_rate: b.approvedRate !== undefined ? Number(b.approvedRate) : 25,
    total_amount: b.totalAmount !== undefined ? Number(b.totalAmount) : (Number(b.quantity) || 100) * 25,
    payment_mode: b.paymentMode || 'Online',
    payment_status: b.paymentStatus || 'Pending',
    payment_date: b.paymentDate || '',
    payment_id: b.paymentId || '',
    bank_name: b.bankName || '',
    account_number: b.accountNumber || '',
    ifsc_code: b.ifscCode || '',
    razorpay_payout_id: b.razorpayPayoutId || null,
    utr_number: b.utrNumber || null
  };
}

/**
 * Helper to map snake_case farmer row to frontend object
 */
export function rowToFarmer(r) {
  if (!r) return null;
  return {
    farmerIdCard: r.farmer_id_card,
    mobileNumber: r.mobile_number,
    farmerName: r.farmer_name || r.full_name,
    fullName: r.full_name || r.farmer_name,
    village: r.village || '',
    taluka: r.taluka || '',
    district: r.district || '',
    state: r.state || 'Gujarat',
    address: r.address || '',
    paymentMode: r.payment_mode || r.preferred_payment_mode || 'Online',
    preferredPaymentMode: r.preferred_payment_mode || r.payment_mode || 'Online',
    accountHolder: r.account_holder || r.farmer_name || '',
    bankName: r.bank_name || 'State Bank of India',
    accountNumber: r.account_number || '',
    ifscCode: r.ifsc_code || 'SBIN0001234',
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || r.created_at || new Date().toISOString()
  };
}

export const supabaseService = {
  isConfigured() {
    return isSupabaseConfigured() && Boolean(supabase);
  },

  async checkHealth() {
    if (!this.isConfigured()) return null;
    const start = performance.now();
    try {
      const { data, count, error } = await supabase
        .from('procurement_centres')
        .select('*', { count: 'exact' });
      const latency = Math.round(performance.now() - start);

      if (error) throw error;
      return {
        status: 'ok',
        database: 'Supabase PostgreSQL',
        configured: true,
        latency,
        centresCount: count || (data ? data.length : 0),
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.warn('Supabase health check failed:', e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Procurement Centres & Sessions
  // -------------------------------------------------------------
  async getCentres() {
    if (!this.isConfigured()) return [];
    const { data, error } = await supabase
      .from('procurement_centres')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching procurement centres from Supabase:', error);
      return [];
    }
    return data || [];
  },

  async getSessions() {
    if (!this.isConfigured()) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_hour', { ascending: true });
    if (error) {
      console.error('Error fetching sessions from Supabase:', error);
      return [];
    }
    return data || [];
  },

  // -------------------------------------------------------------
  // Bookings (Source of Truth)
  // -------------------------------------------------------------
  async getBookings(params = {}) {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

      if (params.mobileNumber) {
        query = query.eq('mobile_number', params.mobileNumber);
      }
      if (params.centreId && params.centreId !== 'ALL') {
        query = query.eq('centre_id', params.centreId);
      }
      if (params.status && params.status !== 'ALL') {
        query = query.eq('status', params.status);
      }
      if (params.date && params.date !== 'ALL') {
        query = query.eq('date', params.date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(rowToBooking);
    } catch (err) {
      console.error('Error fetching bookings from Supabase:', err);
      return null;
    }
  },

  async getBookingBySellingId(sellingId) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .ilike('selling_id', sellingId.trim())
        .maybeSingle();
      if (error) throw error;
      return data ? rowToBooking(data) : null;
    } catch (err) {
      console.error('Error fetching booking by sellingId from Supabase:', err);
      return null;
    }
  },

  async createBooking(bookingData) {
    if (!this.isConfigured()) return null;
    try {
      const row = bookingToRow(bookingData);
      const { data, error } = await supabase
        .from('bookings')
        .insert([row])
        .select()
        .single();
      if (error) throw error;
      return rowToBooking(data);
    } catch (err) {
      console.error('Error creating booking in Supabase:', err);
      throw err;
    }
  },

  async updateBookingStatus(sellingId, status) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('selling_id', sellingId)
        .select()
        .single();
      if (error) throw error;
      return rowToBooking(data);
    } catch (err) {
      console.error('Error updating booking status in Supabase:', err);
      throw err;
    }
  },

  async processPayment(sellingId, paymentData) {
    if (!this.isConfigured()) return null;
    try {
      const isCash = paymentData.paymentMode === 'Cash';
      const paymentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const updatePayload = {
        final_quantity: Number(paymentData.finalQuantity) || 0,
        approved_rate: Number(paymentData.approvedRate) || 0,
        total_amount: (Number(paymentData.finalQuantity) || 0) * (Number(paymentData.approvedRate) || 0),
        status: 'Sale Completed',
        payment_status: 'Paid',
        payment_date: paymentDate,
        payment_id: paymentData.paymentId || (isCash ? `CASH-VCHR-${Date.now().toString().slice(-6)}` : `PAY-DBT-${Date.now().toString().slice(-6)}`),
        payment_mode: paymentData.paymentMode || 'Online'
      };

      if (paymentData.razorpayPayoutId) {
        updatePayload.razorpay_payout_id = paymentData.razorpayPayoutId;
      }
      if (paymentData.utrNumber) {
        updatePayload.utr_number = paymentData.utrNumber;
      }
      if (paymentData.bankName) {
        updatePayload.bank_name = paymentData.bankName;
      }
      if (paymentData.accountNumber) {
        updatePayload.account_number = paymentData.accountNumber;
      }
      if (paymentData.ifscCode) {
        updatePayload.ifsc_code = paymentData.ifscCode;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('selling_id', sellingId)
        .select()
        .single();

      if (error) throw error;
      return rowToBooking(data);
    } catch (err) {
      console.error('Error processing payment in Supabase:', err);
      throw err;
    }
  },

  async markMissed(sellingId) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'Missed' })
        .eq('selling_id', sellingId)
        .select()
        .single();
      if (error) throw error;
      return rowToBooking(data);
    } catch (err) {
      console.error('Error marking booking missed in Supabase:', err);
      throw err;
    }
  },

  async rescheduleBooking(sellingId, { newCentreId, newDate, newSessionId }) {
    if (!this.isConfigured()) return null;
    try {
      // Mark old as Missed (Rebooked)
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'Missed (Rebooked)' })
        .eq('selling_id', sellingId)
        .select()
        .single();
      if (error) throw error;
      return rowToBooking(data);
    } catch (err) {
      console.error('Error rescheduling booking in Supabase:', err);
      throw err;
    }
  },

  // -------------------------------------------------------------
  // Farmers (Source of Truth)
  // -------------------------------------------------------------
  async getAllFarmers(params = {}) {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('farmers').select('*').order('created_at', { ascending: false });

      if (params.search) {
        const s = `%${params.search}%`;
        query = query.or(`farmer_name.ilike.${s},mobile_number.ilike.${s},farmer_id_card.ilike.${s},village.ilike.${s}`);
      }
      if (params.district && params.district !== 'ALL') {
        query = query.eq('district', params.district);
      }
      if (params.paymentMode && params.paymentMode !== 'ALL') {
        query = query.eq('payment_mode', params.paymentMode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(rowToFarmer);
    } catch (err) {
      console.error('Error fetching farmers from Supabase:', err);
      return null;
    }
  },

  async getFarmer(mobileNumber) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToFarmer(data) : null;
    } catch (err) {
      console.error('Error fetching farmer from Supabase:', err);
      return null;
    }
  },

  async loginFarmer(mobileNumber, farmerIdCard = '') {
    if (!this.isConfigured()) return null;
    try {
      const existing = await this.getFarmer(mobileNumber);
      if (existing) {
        // If farmerIdCard provided and differs, update it
        if (farmerIdCard && existing.farmerIdCard !== farmerIdCard) {
          await supabase
            .from('farmers')
            .update({ farmer_id_card: farmerIdCard, updated_at: new Date().toISOString() })
            .eq('mobile_number', mobileNumber);
          existing.farmerIdCard = farmerIdCard;
        }

        return {
          profile: {
            fullName: existing.fullName,
            farmerIdCard: existing.farmerIdCard,
            mobileNumber: existing.mobileNumber,
            village: existing.village,
            taluka: existing.taluka,
            district: existing.district,
            state: existing.state,
            address: existing.address,
            preferredPaymentMode: existing.preferredPaymentMode
          },
          bank: {
            accountHolder: existing.accountHolder,
            bankName: existing.bankName,
            accountNumber: existing.accountNumber,
            ifscCode: existing.ifscCode,
            preferredPaymentMode: existing.preferredPaymentMode
          }
        };
      }

      // If farmer does not exist yet, create a default entry in Supabase
      const newFarmerRow = {
        mobile_number: mobileNumber,
        farmer_id_card: farmerIdCard || '10020030040',
        farmer_name: 'Farmer ' + mobileNumber.slice(-4),
        full_name: 'Farmer ' + mobileNumber.slice(-4),
        village: 'Amreli Rural',
        taluka: 'Amreli',
        district: 'Amreli',
        state: 'Gujarat',
        address: 'Amreli Main Road',
        payment_mode: 'Online',
        preferred_payment_mode: 'Online',
        account_holder: 'Farmer ' + mobileNumber.slice(-4),
        bank_name: 'State Bank of India',
        account_number: '30982000' + mobileNumber.slice(-4),
        ifsc_code: 'SBIN0001234'
      };

      await supabase.from('farmers').insert([newFarmerRow]);

      return {
        profile: {
          fullName: newFarmerRow.full_name,
          farmerIdCard: newFarmerRow.farmer_id_card,
          mobileNumber: newFarmerRow.mobile_number,
          village: newFarmerRow.village,
          taluka: newFarmerRow.taluka,
          district: newFarmerRow.district,
          state: newFarmerRow.state,
          address: newFarmerRow.address,
          preferredPaymentMode: newFarmerRow.preferred_payment_mode
        },
        bank: {
          accountHolder: newFarmerRow.account_holder,
          bankName: newFarmerRow.bank_name,
          accountNumber: newFarmerRow.account_number,
          ifscCode: newFarmerRow.ifsc_code,
          preferredPaymentMode: newFarmerRow.preferred_payment_mode
        }
      };
    } catch (err) {
      console.error('Error during Supabase farmer login:', err);
      return null;
    }
  },

  async updateFarmerProfile(mobileNumber, profile) {
    if (!this.isConfigured()) return null;
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };
      if (profile.fullName) {
        updateData.full_name = profile.fullName;
        updateData.farmer_name = profile.fullName;
      }
      if (profile.farmerIdCard) updateData.farmer_id_card = profile.farmerIdCard;
      if (profile.village) updateData.village = profile.village;
      if (profile.taluka) updateData.taluka = profile.taluka;
      if (profile.district) updateData.district = profile.district;
      if (profile.state) updateData.state = profile.state;
      if (profile.address) updateData.address = profile.address;
      if (profile.preferredPaymentMode) {
        updateData.preferred_payment_mode = profile.preferredPaymentMode;
        updateData.payment_mode = profile.preferredPaymentMode;
      }

      const { data, error } = await supabase
        .from('farmers')
        .upsert({ mobile_number: mobileNumber, ...updateData })
        .select()
        .single();
      if (error) throw error;
      return rowToFarmer(data);
    } catch (err) {
      console.error('Error updating farmer profile in Supabase:', err);
      throw err;
    }
  },

  async updateBankDetails(mobileNumber, bank) {
    if (!this.isConfigured()) return null;
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };
      if (bank.accountHolder) updateData.account_holder = bank.accountHolder;
      if (bank.bankName) updateData.bank_name = bank.bankName;
      if (bank.accountNumber) updateData.account_number = bank.accountNumber;
      if (bank.ifscCode) updateData.ifsc_code = bank.ifscCode;
      if (bank.preferredPaymentMode) {
        updateData.preferred_payment_mode = bank.preferredPaymentMode;
        updateData.payment_mode = bank.preferredPaymentMode;
      }

      const { data, error } = await supabase
        .from('farmers')
        .upsert({ mobile_number: mobileNumber, ...updateData })
        .select()
        .single();
      if (error) throw error;
      return rowToFarmer(data);
    } catch (err) {
      console.error('Error updating bank details in Supabase:', err);
      throw err;
    }
  },

  // -------------------------------------------------------------
  // Live Queues
  // -------------------------------------------------------------
  async getLiveQueues() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase.from('live_queues').select('*');
      if (error) throw error;
      const map = {};
      (data || []).forEach(q => {
        map[q.queue_key] = q.current_token;
      });
      return map;
    } catch (err) {
      console.error('Error fetching live queues from Supabase:', err);
      return null;
    }
  },

  async advanceQueue({ queueKey, centreId, date, sessionId }) {
    if (!this.isConfigured()) return null;
    try {
      const key = queueKey || (centreId && date && sessionId ? `${centreId}_${date}_${sessionId}` : null);
      if (!key) return null;

      // Fetch current token
      const { data: existing } = await supabase
        .from('live_queues')
        .select('current_token')
        .eq('queue_key', key)
        .maybeSingle();

      const nextToken = existing ? (existing.current_token + 1) : 2;

      const { data, error } = await supabase
        .from('live_queues')
        .upsert({
          queue_key: key,
          current_token: nextToken,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { queueKey: key, currentToken: data.current_token };
    } catch (err) {
      console.error('Error advancing queue in Supabase:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------
  async getNotifications(mobileNumber) {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (mobileNumber) {
        query = query.eq('mobile_number', mobileNumber);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id,
        mobileNumber: n.mobile_number,
        title: n.title,
        message: n.message,
        date: n.date,
        read: Boolean(n.read),
        createdAt: n.created_at
      }));
    } catch (err) {
      console.error('Error fetching notifications from Supabase:', err);
      return null;
    }
  },

  async createNotification(n) {
    if (!this.isConfigured()) return null;
    try {
      const row = {
        id: n.id || `n-${Date.now()}`,
        mobile_number: n.mobileNumber || '9876543210',
        title: n.title,
        message: n.message,
        date: n.date || 'Just now',
        read: Boolean(n.read)
      };
      const { data, error } = await supabase
        .from('notifications')
        .insert([row])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating notification in Supabase:', err);
      return null;
    }
  },

  async markNotificationRead(id) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error marking notification read in Supabase:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Admin Statistics
  // -------------------------------------------------------------
  async getAdminStats() {
    if (!this.isConfigured()) return null;
    try {
      const [bookingsRes, farmersRes, centresRes] = await Promise.all([
        supabase.from('bookings').select('status, payment_status, total_amount, quantity'),
        supabase.from('farmers').select('mobile_number', { count: 'exact', head: true }),
        supabase.from('procurement_centres').select('id', { count: 'exact', head: true })
      ]);

      const allBookings = bookingsRes.data || [];
      const totalBookings = allBookings.length;
      const completedSales = allBookings.filter(b => b.status === 'Sale Completed').length;
      const totalDisbursed = allBookings
        .filter(b => b.payment_status === 'Paid')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
      const totalCropProcured = allBookings
        .filter(b => b.status === 'Sale Completed')
        .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

      return {
        totalBookings,
        totalFarmers: farmersRes.count || 50,
        totalCentres: centresRes.count || 4,
        completedSales,
        totalDisbursed,
        totalCropProcured,
        liveQueueCapacity: 64,
        source: 'Supabase PostgreSQL'
      };
    } catch (err) {
      console.error('Error fetching admin stats from Supabase:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Seed / Reset Demo Dataset in Supabase
  // -------------------------------------------------------------
  async seedDemoData() {
    if (!this.isConfigured()) throw new Error('Supabase is not configured with valid URL and publishable key.');

    try {
      // 1. Centres
      const centresRows = [
        { id: 'apmc-main', name: 'APMC Mandi Main Yard', prefix: 'AM', location: 'Yard Gate 1, Mandi Road, Amreli', operating_hours: '08:00 AM - 06:00 PM', daily_capacity: 32, active_counters: 4 },
        { id: 'district-hub', name: 'District Procurement Hub', prefix: 'DH', location: 'Warehouse Area, District Yard, Amreli', operating_hours: '08:00 AM - 06:00 PM', daily_capacity: 32, active_counters: 3 },
        { id: 'kvk', name: 'Kisan Vikas Kendra', prefix: 'KV', location: 'Agricultural Research Complex, Babra', operating_hours: '08:00 AM - 04:00 PM', daily_capacity: 16, active_counters: 2 },
        { id: 'taluka-mandi', name: 'Taluka Mandi Centre', prefix: 'TM', location: 'Taluka Yard, Dhari Road', operating_hours: '08:00 AM - 04:00 PM', daily_capacity: 16, active_counters: 2 }
      ];
      await supabase.from('procurement_centres').upsert(centresRows);

      // 2. Sessions
      const sessionRows = [
        { id: 'session-1', time: '08:00 AM - 10:00 AM', start_hour: 8, start_minute: 0, max_slots: 3 },
        { id: 'session-2', time: '10:00 AM - 12:00 PM', start_hour: 10, start_minute: 0, max_slots: 3 },
        { id: 'session-3', time: '12:00 PM - 02:00 PM', start_hour: 12, start_minute: 0, max_slots: 3 },
        { id: 'session-4', time: '02:00 PM - 04:00 PM', start_hour: 14, start_minute: 0, max_slots: 3 }
      ];
      await supabase.from('sessions').upsert(sessionRows);

      // 3. Generate 50 bookings
      const seedBookings = generate50SeedBookings();

      // Extract unique farmers
      const farmersMap = new Map();
      seedBookings.forEach(b => {
        if (b.mobileNumber && !farmersMap.has(b.mobileNumber)) {
          farmersMap.set(b.mobileNumber, {
            mobile_number: b.mobileNumber,
            farmer_id_card: b.farmerIdCard || '10020030040',
            farmer_name: b.farmerName || 'Registered Farmer',
            full_name: b.farmerName || 'Registered Farmer',
            village: b.village || 'Amreli Rural',
            taluka: b.taluka || 'Amreli',
            district: b.district || 'Amreli',
            state: b.state || 'Gujarat',
            address: `${b.village || 'Amreli'} Main Road, Taluka ${b.taluka || 'Amreli'}`,
            payment_mode: b.paymentMode || 'Online',
            preferred_payment_mode: b.paymentMode || 'Online',
            account_holder: b.farmerName || 'Registered Farmer',
            bank_name: b.bankName || 'State Bank of India',
            account_number: b.accountNumber || '309820001234',
            ifsc_code: b.ifscCode || 'SBIN0001234'
          });
        }
      });
      const farmerRows = Array.from(farmersMap.values());
      await supabase.from('farmers').upsert(farmerRows);

      // Convert bookings
      const bookingRows = seedBookings.map(bookingToRow);
      await supabase.from('bookings').upsert(bookingRows);

      // 4. Initial queues
      const queueRows = [
        { queue_key: '08:00 AM - 10:00 AM', current_token: 1 },
        { queue_key: '10:00 AM - 12:00 PM', current_token: 1 },
        { queue_key: '12:00 PM - 02:00 PM', current_token: 1 },
        { queue_key: '02:00 PM - 04:00 PM', current_token: 1 }
      ];
      await supabase.from('live_queues').upsert(queueRows);

      return {
        success: true,
        seededCentres: centresRows.length,
        seededSessions: sessionRows.length,
        seededFarmers: farmerRows.length,
        seededBookings: bookingRows.length
      };
    } catch (err) {
      console.error('Error seeding demo data in Supabase:', err);
      throw err;
    }
  }
};

export default supabaseService;
