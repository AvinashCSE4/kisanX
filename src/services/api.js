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
  // Health
  async checkHealth() {
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
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const url = `${API_BASE}/bookings${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async getBookingBySellingId(sellingId) {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}`);
    return await handleResponse(res);
  },

  async createBooking(bookingData) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return await handleResponse(res);
  },

  async updateBookingStatus(sellingId, status) {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await handleResponse(res);
  },

  async processPayment(sellingId, paymentData) {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await handleResponse(res);
  },

  async markMissed(sellingId) {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/missed`, {
      method: 'PUT'
    });
    return await handleResponse(res);
  },

  async rescheduleBooking(sellingId, { newCentreId, newDate, newSessionId }) {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(sellingId)}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newCentreId, newDate, newSessionId })
    });
    return await handleResponse(res);
  },

  // Farmers & OTP Auth
  async sendOtp(mobileNumber) {
    const res = await fetch(`${API_BASE}/farmers/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber })
    });
    return await handleResponse(res);
  },

  async verifyOtp(mobileNumber, otp, farmerIdCard) {
    const res = await fetch(`${API_BASE}/farmers/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, otp, farmerIdCard })
    });
    return await handleResponse(res);
  },

  async loginFarmer(mobileNumber, farmerIdCard) {
    const res = await fetch(`${API_BASE}/farmers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, farmerIdCard })
    });
    return await handleResponse(res);
  },

  async getAllFarmers(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const url = `${API_BASE}/farmers${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async getFarmer(mobileNumber) {
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}`);
    return await handleResponse(res);
  },

  async updateFarmerProfile(mobileNumber, profile) {
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return await handleResponse(res);
  },

  async updateBankDetails(mobileNumber, bank) {
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobileNumber)}/bank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank)
    });
    return await handleResponse(res);
  },

  // Queues
  async getLiveQueues() {
    const res = await fetch(`${API_BASE}/queues/live`);
    return await handleResponse(res);
  },

  async advanceQueue({ queueKey, centreId, date, sessionId }) {
    const res = await fetch(`${API_BASE}/queues/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueKey, centreId, date, sessionId })
    });
    return await handleResponse(res);
  },

  // Notifications
  async getNotifications(mobileNumber) {
    const url = mobileNumber
      ? `${API_BASE}/notifications?mobileNumber=${encodeURIComponent(mobileNumber)}`
      : `${API_BASE}/notifications`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT'
    });
    return await handleResponse(res);
  },

  // Admin
  async getAdminStats() {
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
