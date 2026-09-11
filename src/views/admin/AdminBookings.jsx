import React, { useState } from 'react';
import { Search, Filter, FileText, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import BookingSlipModal from '../../components/BookingSlipModal';
import PaymentSlipModal from '../../components/PaymentSlipModal';

export const AdminBookings = ({ onSelectBooking }) => {
  const { t } = useLanguage();
  const { bookings } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCentre, setFilterCentre] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState(null);

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.sellingId.toLowerCase().includes(q) ||
      (b.centreToken && b.centreToken.toLowerCase().includes(q)) ||
      b.farmerName.toLowerCase().includes(q) ||
      b.crop.toLowerCase().includes(q) ||
      b.mobileNumber.includes(q);

    const matchesCentre =
      filterCentre === 'ALL' ||
      b.centreId === filterCentre ||
      (b.centre && b.centre.toLowerCase().includes(filterCentre.toLowerCase()));

    const matchesStatus =
      filterStatus === 'ALL' || b.status === filterStatus || b.paymentStatus === filterStatus;

    const matchesDate =
      filterDate === 'ALL' || b.date.includes(filterDate);

    return matchesSearch && matchesCentre && matchesStatus && matchesDate;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked': return 'badge badge-booked';
      case 'Arrived': return 'badge badge-arrived';
      case 'Crop Verified': return 'badge badge-verified';
      case 'Weighed': return 'badge badge-weighed';
      case 'Sale Completed': return 'badge badge-completed';
      case 'Missed': return 'badge badge-missed';
      default: return 'badge badge-booked';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">{t('adminNavBookings')}</h1>
        <p className="subtitle">All registered crop selling slots and mandi arrivals</p>
      </div>

      {/* Filters & Search Box */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Search Input */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>{t('search')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="ID, Token, Farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter by Centre */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>{t('filterCentre') || 'Centre'}</label>
            <select
              className="form-select"
              value={filterCentre}
              onChange={(e) => setFilterCentre(e.target.value)}
            >
              <option value="ALL">All Centres</option>
              <option value="apmc-main">APMC Mandi Main (AM)</option>
              <option value="district-hub">District Hub (DH)</option>
              <option value="kvk">Kisan Vikas Kendra (KV)</option>
              <option value="taluka-mandi">Taluka Mandi (TM)</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>{t('status')}</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Booked">Booked</option>
              <option value="Arrived">Arrived</option>
              <option value="Crop Verified">Crop Verified</option>
              <option value="Weighed">Weighed</option>
              <option value="Sale Completed">Sale Completed</option>
              <option value="Missed">Missed</option>
              <option value="Paid">Payment: Paid</option>
              <option value="Pending">Payment: Pending</option>
            </select>
          </div>

          {/* Filter by Date */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>{t('date')}</label>
            <select
              className="form-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="ALL">All Dates</option>
              <option value="10 September 2026">10 September 2026</option>
              <option value="11 September 2026">11 September 2026</option>
              <option value="12 September 2026">12 September 2026</option>
              <option value="13 September 2026">13 September 2026</option>
              <option value="14 September 2026">14 September 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table on Laptop, Cards on Mobile (Section 14) */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>{t('sellingId')}</th>
              <th>{t('farmer')}</th>
              <th>{t('crop')}</th>
              <th>Centre</th>
              <th>{t('date')}</th>
              <th>{t('time')}</th>
              <th>{t('status')}</th>
              <th>{t('paymentStatus')}</th>
              <th style={{ textAlign: 'center' }}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                  No bookings found matching filters.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.sellingId}>
                  <td>
                    <span style={{
                      backgroundColor: 'var(--color-blue-bg)',
                      color: 'var(--color-blue)',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      border: '1px solid var(--color-blue-border)'
                    }}>
                      {b.centreToken || ('#' + (b.tokenNumber || 1))}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-blue-dark)' }}>
                    {b.sellingId}
                  </td>
                  <td>
                    <div><strong>{b.farmerName}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>+91 {b.mobileNumber}</div>
                  </td>
                  <td>{b.crop} ({b.quantity} {b.unit})</td>
                  <td style={{ fontSize: '12px' }}>{b.centre || 'APMC Main'}</td>
                  <td>{b.date}</td>
                  <td>{b.timeSlot}</td>
                  <td>
                    <span className={getStatusBadgeClass(b.status)}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${b.paymentStatus === 'Paid' ? 'badge-paid' : b.paymentStatus === 'Failed' ? 'badge-failed' : 'badge-pending'}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline-blue btn-small"
                        onClick={() => setSelectedSlip(b)}
                        title="View Booking Slip"
                      >
                        <FileText size={14} />
                      </button>
                      {b.paymentStatus === 'Paid' && (
                        <button
                          type="button"
                          className="btn btn-blue btn-small"
                          onClick={() => setSelectedPaymentSlip(b)}
                          title="View Payment Slip"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {onSelectBooking && (
                        <button
                          type="button"
                          className="btn btn-outline-blue btn-small"
                          onClick={() => onSelectBooking(b.sellingId)}
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedSlip && (
        <BookingSlipModal
          booking={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
      {selectedPaymentSlip && (
        <PaymentSlipModal
          booking={selectedPaymentSlip}
          onClose={() => setSelectedPaymentSlip(null)}
        />
      )}
    </div>
  );
};

export default AdminBookings;
