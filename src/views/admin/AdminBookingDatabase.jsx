import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Download,
  Filter,
  CreditCard,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  ShoppingBag,
  Clock,
  ExternalLink
} from 'lucide-react';
import { usePortalData } from '../../context/PortalDataContext';
import BookingSlipModal from '../../components/BookingSlipModal';
import PaymentSlipModal from '../../components/PaymentSlipModal';

export const AdminBookingDatabase = ({ onSelectBooking }) => {
  const { bookings } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCentre, setFilterCentre] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterCrop, setFilterCrop] = useState('ALL');

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState(null);

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.sellingId.toLowerCase().includes(q) ||
      (b.centreToken && b.centreToken.toLowerCase().includes(q)) ||
      (b.farmerName && b.farmerName.toLowerCase().includes(q)) ||
      (b.crop && b.crop.toLowerCase().includes(q)) ||
      (b.mobileNumber && b.mobileNumber.includes(q)) ||
      (b.farmerIdCard && b.farmerIdCard.includes(q));

    const matchesCentre =
      filterCentre === 'ALL' ||
      b.centreId === filterCentre ||
      (b.centre && b.centre.toLowerCase().includes(filterCentre.toLowerCase()));

    const matchesStatus =
      filterStatus === 'ALL' || b.status === filterStatus || b.paymentStatus === filterStatus;

    const matchesDate =
      filterDate === 'ALL' || (b.date && b.date.includes(filterDate));

    const matchesCrop =
      filterCrop === 'ALL' || b.crop === filterCrop;

    return matchesSearch && matchesCentre && matchesStatus && matchesDate && matchesCrop;
  });

  // Unique crops and dates
  const crops = Array.from(new Set(bookings.map(b => b.crop).filter(Boolean)));
  const dates = Array.from(new Set(bookings.map(b => b.date).filter(Boolean)));

  // Export CSV
  const exportToCsv = () => {
    const headers = [
      'Selling ID',
      'Centre Token',
      'Farmer Name',
      'Mobile No',
      'Farmer ID Card',
      'Crop',
      'Variety',
      'Quantity (kg)',
      'Centre Name',
      'Date',
      'Time Slot',
      'Token No',
      'Status',
      'Rate (Rs/kg)',
      'Total Amount (Rs)',
      'Payment Mode',
      'Payment Status',
      'Bank Name',
      'Account Number',
      'UTR Number',
      'Created At'
    ];

    const rows = filteredBookings.map(b => [
      `"${b.sellingId || ''}"`,
      `"${b.centreToken || ''}"`,
      `"${b.farmerName || ''}"`,
      `"${b.mobileNumber || ''}"`,
      `"${b.farmerIdCard || ''}"`,
      `"${b.crop || ''}"`,
      `"${b.variety || ''}"`,
      b.quantity || 0,
      `"${b.centreName || b.centre || ''}"`,
      `"${b.date || ''}"`,
      `"${b.timeSlot || ''}"`,
      b.tokenNumber || 1,
      `"${b.status || 'Booked'}"`,
      b.approvedRate || 0,
      b.totalAmount || 0,
      `"${b.paymentMode || 'Online'}"`,
      `"${b.paymentStatus || 'Pending'}"`,
      `"${b.bankName || ''}"`,
      `"${b.accountNumber || ''}"`,
      `"${b.utrNumber || ''}"`,
      `"${b.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kisanx_bookings_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div style={{ paddingBottom: '30px' }}>
      {/* Top Banner & Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              SQLite Table: bookings
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Full Mandi Procurement Records
            </span>
          </div>
          <h1 className="page-title" style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#0F172A' }}>
            📋 Mandi Booking Database
          </h1>
          <p className="subtitle" style={{ margin: 0, fontSize: '13.5px' }}>
            All procurement selling appointments, queue positions, physical weighments, and disbursement transactions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={exportToCsv}
            style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
          >
            <FileSpreadsheet size={15} />
            Export CSV ({filteredBookings.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card blue-theme">
          <div className="metric-header">
            <span className="metric-label">Total Registered Bookings</span>
            <div className="metric-icon-box blue">
              <Calendar size={20} />
            </div>
          </div>
          <div className="metric-value">{bookings.length}</div>
          <div className="metric-subtext">Across 4 procurement centres</div>
        </div>

        <div className="metric-card green-theme">
          <div className="metric-header">
            <span className="metric-label">Completed Sales</span>
            <div className="metric-icon-box green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value">
            {bookings.filter(b => b.status === 'Sale Completed').length}
          </div>
          <div className="metric-subtext">Physical weighment done</div>
        </div>

        <div className="metric-card purple-theme">
          <div className="metric-header">
            <span className="metric-label">Disbursed DBT Payouts</span>
            <div className="metric-icon-box purple">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="metric-value">
            ₹{bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="metric-subtext">Bank transfers credited</div>
        </div>

        <div className="metric-card amber-theme">
          <div className="metric-header">
            <span className="metric-label">Active Mandi Queue Slots</span>
            <div className="metric-icon-box amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value">
            {bookings.filter(b => b.status !== 'Sale Completed' && b.status !== 'Cancelled').length}
          </div>
          <div className="metric-subtext">Awaiting intake & weighment</div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Search Booking Database</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Selling ID (KS-2026-...), Token, Farmer Name, Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Centre Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>Centre / Venue</label>
            <select
              className="form-select"
              value={filterCentre}
              onChange={(e) => setFilterCentre(e.target.value)}
            >
              <option value="ALL">All Centres</option>
              <option value="apmc-main">APMC Main Yard (AM)</option>
              <option value="district-hub">District Hub (DH)</option>
              <option value="kvk">Kisan Vikas Kendra (KV)</option>
              <option value="taluka-mandi">Taluka Mandi (TM)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>Status</label>
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
              <option value="Paid">Paid</option>
              <option value="Pending">Pending Payment</option>
            </select>
          </div>

          {/* Crop Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>Crop Commodity</label>
            <select
              className="form-select"
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
            >
              <option value="ALL">All Crops</option>
              {crops.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '13px' }}>Date</label>
            <select
              className="form-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="ALL">All Dates</option>
              {dates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Database Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
            📋 Showing {filteredBookings.length} of {bookings.length} Procurement Bookings
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '4px' }}>
            Scroll horizontally to view complete booking attributes
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '12px 14px', position: 'sticky', left: 0, backgroundColor: '#F1F5F9', zIndex: 2 }}>Selling ID</th>
                <th style={{ padding: '12px 14px', position: 'sticky', left: '130px', backgroundColor: '#F1F5F9', zIndex: 2 }}>Centre Token</th>
                <th style={{ padding: '12px 14px' }}>Farmer Name</th>
                <th style={{ padding: '12px 14px' }}>Mobile No</th>
                <th style={{ padding: '12px 14px' }}>Farmer ID Card</th>
                <th style={{ padding: '12px 14px' }}>Crop Commodity</th>
                <th style={{ padding: '12px 14px' }}>Quantity</th>
                <th style={{ padding: '12px 14px' }}>Centre / Mandi</th>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px' }}>Session / Slot</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Total Amount</th>
                <th style={{ padding: '12px 14px' }}>Payment Mode</th>
                <th style={{ padding: '12px 14px' }}>Payment Status</th>
                <th style={{ padding: '12px 14px' }}>Bank & UTR</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Slips</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => (
                  <tr
                    key={b.sellingId || idx}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                    }}
                  >
                    {/* Selling ID */}
                    <td style={{
                      padding: '10px 14px',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      zIndex: 1
                    }}>
                      <span
                        onClick={() => onSelectBooking && onSelectBooking(b.sellingId)}
                        style={{
                          fontWeight: '800',
                          fontFamily: 'monospace',
                          color: '#2563EB',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {b.sellingId}
                      </span>
                    </td>

                    {/* Centre Token */}
                    <td style={{
                      padding: '10px 14px',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: '130px',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      zIndex: 1
                    }}>
                      <span className="token-pill" style={{ fontWeight: '800', fontSize: '11.5px', padding: '3px 8px' }}>
                        {b.centreToken || `AM-${String(b.tokenNumber || 1).padStart(3, '0')}`}
                      </span>
                    </td>

                    {/* Farmer Name */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '700', color: '#0F172A' }}>
                      {b.farmerName}
                    </td>

                    {/* Mobile No */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#475569' }}>
                      +91 {b.mobileNumber}
                    </td>

                    {/* Farmer ID Card */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: '11px', color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '2px 5px', borderRadius: '4px' }}>
                        {b.farmerIdCard || '10020030040'}
                      </code>
                    </td>

                    {/* Crop */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      {b.crop} <span style={{ fontSize: '11px', color: '#64748B' }}>({b.variety || 'Standard'})</span>
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '700' }}>
                      {b.finalQuantity || b.quantity} {b.unit || 'kg'}
                    </td>

                    {/* Centre */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {b.centreName || b.centre || 'APMC Mandi Main Yard'}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {b.date}
                    </td>

                    {/* Slot */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748B', fontSize: '11.5px' }}>
                      {b.timeSlot || '08:00 AM - 10:00 AM'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span className={getStatusBadgeClass(b.status)}>
                        {b.status}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '800', color: '#0F172A' }}>
                      ₹{((b.totalAmount) || (b.quantity * (b.approvedRate || 25))).toLocaleString('en-IN')}
                    </td>

                    {/* Payment Mode */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        backgroundColor: b.paymentMode === 'Online' ? '#ECFDF5' : '#FFFBEB',
                        color: b.paymentMode === 'Online' ? '#065F46' : '#B45309',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {b.paymentMode || 'Online'}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        backgroundColor: b.paymentStatus === 'Paid' ? '#ECFDF5' : '#FEF3C7',
                        color: b.paymentStatus === 'Paid' ? '#065F46' : '#92400E',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {b.paymentStatus === 'Paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>

                    {/* Bank & UTR */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: '11px', color: '#475569' }}>
                      {b.utrNumber ? (
                        <div>
                          <span style={{ fontWeight: '700', color: '#047857' }}>UTR: {b.utrNumber}</span>
                          <div style={{ fontSize: '10.5px' }}>{b.bankName || 'SBI'} ••••{b.accountNumber ? b.accountNumber.slice(-4) : '1234'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Pending Payout</span>
                      )}
                    </td>

                    {/* Action Slips */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          style={{ padding: '3px 7px', fontSize: '11px' }}
                          onClick={() => setSelectedSlip(b)}
                          title="View Official Gate Booking Slip"
                        >
                          Booking Slip
                        </button>
                        {b.paymentStatus === 'Paid' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            style={{ padding: '3px 7px', fontSize: '11px', color: '#047857' }}
                            onClick={() => setSelectedPaymentSlip(b)}
                            title="View DBT Disbursement Receipt"
                          >
                            Payment Slip
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
      </div>

      {/* Slip Modals */}
      {selectedSlip && (
        <BookingSlipModal booking={selectedSlip} onClose={() => setSelectedSlip(null)} />
      )}
      {selectedPaymentSlip && (
        <PaymentSlipModal booking={selectedPaymentSlip} onClose={() => setSelectedPaymentSlip(null)} />
      )}
    </div>
  );
};

export default AdminBookingDatabase;
