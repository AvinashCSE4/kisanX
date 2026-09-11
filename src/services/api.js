import supabaseService from './supabaseService';
import { generate50SeedBookings, generate50SeedFarmers } from '../data/initialBookings.js';

const API_BASE = '/api';

/**
 * Helper to handle fetch responses safely
 */
async function handleResponse(res) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export const api = {
  isSupabase() {
    return supabaseService.isConfigured();
  },

  // Health
  async checkHealth() {
    if (supabaseService.isConfigured()) {
      const health = await supabaseService.checkHealth();
      if (health) return health;
    }
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse(res);
    } catch (e) {
      console.warn('Backend API unreachable, using local fallback', e);
      return null;
    }
  },

  // Bookings
  async getBookings(params = {}) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getBookings(params);
      if (data !== null && data.length > 0) {
        return { success: true, data, source: 'Supabase' };
      }
    }
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const url = `${API_BASE}/bookings${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetch(url);
      return await handleResponse(res);
    } catch (e) {
      return { success: true, data: generate50SeedBookings(), source: 'Local Seed' };
    }
  },

  async getBookingBySellingId(sellingId) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getBookingBySellingId(sellingId);
      return { success: Boolean(data), data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}`);
    return await handleResponse(res);
  },

  async createBooking(bookingData) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.createBooking(bookingData);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return await handleResponse(res);
  },

  async updateBookingStatus(sellingId, status) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.updateBookingStatus(sellingId, status);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await handleResponse(res);
  },

  async processPayment(sellingId, paymentData) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.processPayment(sellingId, paymentData);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await handleResponse(res);
  },

  async markMissed(sellingId) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.markMissed(sellingId);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/missed`, {
      method: 'PUT'
    });
    return await handleResponse(res);
  },

  async rescheduleBooking(sellingId, { newCentreId, newDate, newSessionId }) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.rescheduleBooking(sellingId, { newCentreId, newDate, newSessionId });
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newCentreId, newDate, newSessionId })
    });
    return await handleResponse(res);
  },

  // Farmers & OTP Auth
  async sendOtp(mobileNumber) {
    if (supabaseService.isConfigured()) {
      return { success: true, message: 'OTP sent successfully (Demo OTP: 123456)' };
    }
    const res = await fetch(`${API_BASE}/farmers/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber })
    });
    return await handleResponse(res);
  },

  async verifyOtp(mobileNumber, otp, farmerIdCard) {
    if (supabaseService.isConfigured()) {
      if (otp === '123456') {
        const farmerData = await supabaseService.loginFarmer(mobileNumber, farmerIdCard);
        return { success: true, verified: true, data: farmerData };
      } else {
        return { success: false, error: 'Invalid OTP. Enter 123456' };
      }
    }
    const res = await fetch(`${API_BASE}/farmers/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, otp, farmerIdCard })
    });
    return await handleResponse(res);
  },

  async loginFarmer(mobileNumber, farmerIdCard) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.loginFarmer(mobileNumber, farmerIdCard);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/farmers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, farmerIdCard })
    });
    return await handleResponse(res);
  },

  async getAllFarmers(params = {}) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getAllFarmers(params);
      if (data !== null && data.length > 0) {
        return { success: true, data, source: 'Supabase' };
      }
    }
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const url = `${API_BASE}/farmers${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetch(url);
      return await handleResponse(res);
    } catch (e) {
      return { success: true, data: generate50SeedFarmers(), source: 'Local Seed' };
    }
  },

  async getFarmer(mobileNumber) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getFarmer(mobileNumber);
      return { success: Boolean(data), data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}`);
    return await handleResponse(res);
  },

  async updateFarmerProfile(mobileNumber, profile) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.updateFarmerProfile(mobileNumber, profile);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return await handleResponse(res);
  },

  async updateBankDetails(mobileNumber, bank) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.updateBankDetails(mobileNumber, bank);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}/bank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank)
    });
    return await handleResponse(res);
  },

  // Queues
  async getLiveQueues() {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getLiveQueues();
      if (data !== null) {
        return { success: true, data, source: 'Supabase' };
      }
    }
    const res = await fetch(`${API_BASE}/queues/live`);
    return await handleResponse(res);
  },

  async advanceQueue({ queueKey, centreId, date, sessionId }) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.advanceQueue({ queueKey, centreId, date, sessionId });
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/queues/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueKey, centreId, date, sessionId })
    });
    return await handleResponse(res);
  },

  // Notifications
  async getNotifications(mobileNumber) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getNotifications(mobileNumber);
      if (data !== null) {
        return { success: true, data, source: 'Supabase' };
      }
    }
    const url = mobileNumber
      ? `${API_BASE}/notifications?mobileNumber=${encodeURIComponent(mobileNumber)}`
      : `${API_BASE}/notifications`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async markNotificationRead(id) {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.markNotificationRead(id);
      return { success: true, data, source: 'Supabase' };
    }
    const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT'
    });
    return await handleResponse(res);
  },

  // Admin
  async getAdminStats() {
    if (supabaseService.isConfigured()) {
      const data = await supabaseService.getAdminStats();
      if (data !== null) {
        return { success: true, data, source: 'Supabase' };
      }
    }
    const res = await fetch(`${API_BASE}/admin/stats`);
    return await handleResponse(res);
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/admin/reset-seed`, {
      method: 'POST'
    });
    return await handleResponse(res);
  },

  async clearAllData() {
    const res = await fetch(`${API_BASE}/admin/clear-all`, {
      method: 'POST'
    });
    return await handleResponse(res);
  }
};

export default api;
