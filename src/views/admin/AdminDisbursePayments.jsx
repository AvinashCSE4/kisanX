import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText,
  Building,
  User,
  Zap,
  Banknote,
  Download,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import { maskAccountNumber } from '../../utils/idGenerator';
import RazorpayModal from '../../components/RazorpayModal';
import PaymentSlipModal from '../../components/PaymentSlipModal';

export const AdminDisbursePayments = ({ initialSellingId = '', onSelectBooking }) => {
  const { t } = useLanguage();
  const { bookings, processFarmerPayment, findBookingBySellingId } = usePortalData();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSellingId || '');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Payout calculation form
  const [weighedQty, setWeighedQty] = useState('');
  const [approvedRate, setApprovedRate] = useState('25');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showPaymentSlip, setShowPaymentSlip] = useState(false);
  const [payoutSuccessNotice, setPayoutSuccessNotice] = useState(false);

  // Sync if initialSellingId provided or on load
  useEffect(() => {
    if (initialSellingId) {
      const found = findBookingBySellingId(initialSellingId);
      if (found) {
        handleSelectRow(found);
      }
    } else if (!selectedBooking && bookings.length > 0) {
      // Pre-select first booking that needs payout (Pending) or first booking
      const pendingItem = bookings.find(b => b.paymentStatus === 'Pending') || bookings[0];
      if (pendingItem) {
        handleSelectRow(pendingItem);
      }
    }
  }, [initialSellingId, bookings]);

  const handleSelectRow = (booking) => {
    setSelectedBooking(booking);
    setWeighedQty(String(booking.finalQuantity || booking.quantity || 100));
    setApprovedRate(String(booking.approvedRate || 25));
    setPayoutSuccessNotice(false);
  };

  // Disburse payment
  const handleDisburseSubmit = (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (selectedBooking.paymentMode === 'Cash') {
      // Direct Cash Voucher at Counter
      processFarmerPayment(selectedBooking.sellingId, weighedQty, approvedRate, { paymentMode: 'Cash' });
      setSelectedBooking(prev => ({
        ...prev,
        status: 'Sale Completed',
        paymentStatus: 'Paid',
        finalQuantity: Number(weighedQty),
        approvedRate: Number(approvedRate),
        totalAmount: Number(weighedQty) * Number(approvedRate),
        paymentDate: new Date().toLocaleDateString('en-GB')
      }));
      setPayoutSuccessNotice(true);
      setTimeout(() => setPayoutSuccessNotice(false), 5000);
    } else {
      // Online DBT: Trigger Razorpay Gateway Modal
      setShowRazorpayModal(true);
    }
  };

  const handleRazorpaySuccess = (result) => {
    if (!selectedBooking) return;
    processFarmerPayment(selectedBooking.sellingId, weighedQty, approvedRate, result);
    setSelectedBooking(prev => ({
      ...prev,
      ...result,
      status: 'Sale Completed',
      paymentStatus: 'Paid',
      finalQuantity: Number(weighedQty),
      approvedRate: Number(approvedRate),
      totalAmount: Number(weighedQty) * Number(approvedRate),
      paymentDate: new Date().toLocaleDateString('en-GB')
    }));
    setShowRazorpayModal(false);
    setPayoutSuccessNotice(true);
    setTimeout(() => setPayoutSuccessNotice(false), 6000);
  };

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      b.sellingId.toLowerCase().includes(q) ||
      (b.centreToken && b.centreToken.toLowerCase().includes(q)) ||
      (b.farmerName && b.farmerName.toLowerCase().includes(q)) ||
      (b.crop && b.crop.toLowerCase().includes(q)) ||
      (b.mobileNumber && b.mobileNumber.includes(q)) ||
      (b.paymentId && b.paymentId.toLowerCase().includes(q));

    const matchesMode = modeFilter === 'ALL' || b.paymentMode === modeFilter;
    const matchesStatus = paymentStatusFilter === 'ALL' || b.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesMode && matchesStatus;
  });

  // KPI Calculations
  const pendingList = bookings.filter(b => b.paymentStatus !== 'Paid');
  const paidList = bookings.filter(b => b.paymentStatus === 'Paid');
  const totalPendingAmount = pendingList.reduce((sum, b) => sum + (b.totalAmount || ((b.finalQuantity || b.quantity || 0) * (b.approvedRate || 25))), 0);
  const totalPaidAmount = paidList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const onlineCount = bookings.filter(b => b.paymentMode === 'Online').length;
  const cashCount = bookings.filter(b => b.paymentMode === 'Cash').length;

  const currentTotalCalculated = (Number(weighedQty) || 0) * (Number(approvedRate) || 0);

  return (
    <div className="admin-disburse-payments">
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <CreditCard size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>
              Farmer Payment Disbursement & DBT
            </h1>
            <p className="subtitle" style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              Disburse payments via Online DBT (Bank Transfer / Razorpay) or APMC Mandi Cash Counter Vouchers
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Awaiting Disbursement
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
            ₹{totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            {pendingList.length} Farmers waiting for payout settlement
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Total Settled & Disbursed
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            {paidList.length} Successful disbursements completed
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Disbursement Channels
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            {onlineCount} Online DBT • {cashCount} Cash
          </div>
          <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '4px' }}>
            Government Direct Benefit Transfer & Mandi Counter
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Table & Right Side Payment Console */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedBooking ? '1.2fr 1fr' : '1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Side: Payments Table */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
              📋 Farmer Payout Registry ({filteredBookings.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Click any row to settle or view payment
            </span>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, Farmer, Mobile, Payout ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            <select
              className="form-select"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Pending">Awaiting Payout (Pending)</option>
              <option value="Paid">Disbursed (Paid)</option>
            </select>

            <select
              className="form-select"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="ALL">All Payment Modes</option>
              <option value="Online">Online DBT</option>
              <option value="Cash">Cash at Counter</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>Selling ID</th>
                  <th>Farmer</th>
                  <th>Crop & Weight</th>
                  <th>Total Payout</th>
                  <th>Mode & Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                      No matching payout records found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => {
                    const isSelected = selectedBooking?.sellingId === b.sellingId;
                    const totalAmt = b.totalAmount || ((b.finalQuantity || b.quantity || 0) * (b.approvedRate || 25));
                    const isPaid = b.paymentStatus === 'Paid';

                    return (
                      <tr
                        key={b.sellingId}
                        onClick={() => handleSelectRow(b)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#F5F3FF' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' }}>{b.sellingId}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{b.centreToken || 'TK-01'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#1E293B' }}>{b.farmerName}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{b.mobileNumber}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0D9488' }}>{b.crop}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {b.finalQuantity || b.quantity} kg @ ₹{b.approvedRate || 25}/kg
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                            ₹{totalAmt.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              backgroundColor: b.paymentMode === 'Cash' ? '#FEF3C7' : '#EFF6FF',
                              color: b.paymentMode === 'Cash' ? '#B45309' : '#1E40AF',
                              width: 'fit-content'
                            }}>
                              {b.paymentMode === 'Cash' ? 'Cash Counter' : 'Online DBT'}
                            </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              backgroundColor: isPaid ? '#DCFCE7' : '#FEE2E2',
                              color: isPaid ? '#166534' : '#991B1B',
                              width: 'fit-content'
                            }}>
                              {isPaid ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(b);
                            }}
                            style={{
                              backgroundColor: isSelected ? '#7C3AED' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#1E293B',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CreditCard size={13} />
                            <span>{isSelected ? 'Selected' : (isPaid ? 'View' : 'Disburse')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Active Payment Settlement Console */}
        {selectedBooking && (
          <div className="card" style={{ padding: '20px', borderTop: '4px solid #7C3AED', position: 'sticky', top: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DISBURSEMENT SETTLEMENT DESK
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  {selectedBooking.farmerName}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Selling ID: <strong style={{ fontFamily: 'monospace' }}>{selectedBooking.sellingId}</strong>
                </div>
              </div>

              {selectedBooking.paymentStatus === 'Paid' && (
                <button
                  type="button"
                  className="btn btn-blue btn-small"
                  onClick={() => setShowPaymentSlip(true)}
                  style={{ fontSize: '12px', backgroundColor: '#7C3AED', borderColor: '#6D28D9' }}
                >
                  <FileText size={14} />
                  Payment Slip
                </button>
              )}
            </div>

            {/* Payout Channel Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Disbursement Routing:</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: selectedBooking.paymentMode === 'Cash' ? '#FEF3C7' : '#DBEAFE',
                  color: selectedBooking.paymentMode === 'Cash' ? '#92400E' : '#1E40AF'
                }}>
                  {selectedBooking.paymentMode === 'Cash' ? '💵 Cash at Mandi Counter' : '🏦 Online DBT Transfer'}
                </span>
              </div>

              {selectedBooking.paymentMode === 'Cash' ? (
                <div style={{ color: '#475569', fontSize: '12px' }}>
                  Voucher generated for immediate cash collection at APMC Mandi Cash Counter No. 1.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#334155' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Bank: </span>
                    <strong>{selectedBooking.bankName || 'State Bank of India'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Account: </span>
                    <strong style={{ fontFamily: 'monospace' }}>
                      {maskAccountNumber(selectedBooking.accountNumber || '309820010040')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>IFSC: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedBooking.ifscCode || 'SBIN0001234'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Status: </span>
                    <strong style={{ color: '#059669' }}>✓ KYC Verified</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Payout Calculation Form */}
            <form onSubmit={handleDisburseSubmit}>
              <div style={{
                backgroundColor: '#F5F3FF',
                border: '1.5px solid #DDD6FE',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#5B21B6', marginBottom: '10px' }}>
                  MSP Fair Value Settlement Calculator
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Net Weighed Weight (kg)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={weighedQty}
                      onChange={(e) => setWeighedQty(e.target.value)}
                      disabled={selectedBooking.paymentStatus === 'Paid'}
                      required
                      style={{ fontSize: '14px', fontWeight: '700' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      MSP Approved Rate (₹/kg)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={approvedRate}
                      onChange={(e) => setApprovedRate(e.target.value)}
                      disabled={selectedBooking.paymentStatus === 'Paid'}
                      required
                      style={{ fontSize: '14px', fontWeight: '700' }}
                    />
                  </div>
                </div>

                {/* Total Payout Display */}
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C4B5FD',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6D28D9' }}>TOTAL AMOUNT PAYABLE:</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
                      ₹{currentTotalCalculated.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: selectedBooking.paymentStatus === 'Paid' ? '#166534' : '#B45309',
                    backgroundColor: selectedBooking.paymentStatus === 'Paid' ? '#DCFCE7' : '#FEF3C7',
                    padding: '4px 10px',
                    borderRadius: '12px'
                  }}>
                    {selectedBooking.paymentStatus === 'Paid' ? 'PAID & SETTLED' : 'AWAITING PAYMENT'}
                  </span>
                </div>
              </div>

              {payoutSuccessNotice && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={18} />
                  <span>Payment of ₹{currentTotalCalculated.toLocaleString('en-IN')} disbursed successfully!</span>
                </div>
              )}

              {/* Action Button */}
              {selectedBooking.paymentStatus !== 'Paid' ? (
                <button
                  type="submit"
                  className="btn btn-blue"
                  style={{
                    backgroundColor: '#7C3AED',
                    borderColor: '#6D28D9',
                    width: '100%',
                    fontSize: '15px',
                    fontWeight: '800',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CreditCard size={18} />
                  <span>
                    {selectedBooking.paymentMode === 'Cash'
                      ? `Generate Cash Counter Voucher (₹${currentTotalCalculated.toLocaleString('en-IN')})`
                      : `Disburse via Razorpay DBT (₹${currentTotalCalculated.toLocaleString('en-IN')})`}
                  </span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPaymentSlip(true)}
                    className="btn btn-blue"
                    style={{
                      flex: 1,
                      backgroundColor: '#16A34A',
                      borderColor: '#15803D',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  >
                    <FileText size={16} />
                    <span>View Official Payment Slip</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Razorpay Gateway Modal */}
      {showRazorpayModal && selectedBooking && (
        <RazorpayModal
          booking={selectedBooking}
          weighedQty={weighedQty}
          approvedRate={approvedRate}
          totalAmount={currentTotalCalculated}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayModal(false)}
        />
      )}

      {/* Payment Slip Modal */}
      {showPaymentSlip && selectedBooking && (
        <PaymentSlipModal
          booking={{
            ...selectedBooking,
            finalQuantity: Number(weighedQty),
            approvedRate: Number(approvedRate),
            totalAmount: currentTotalCalculated,
            paymentStatus: 'Paid'
          }}
          onClose={() => setShowPaymentSlip(false)}
        />
      )}
    </div>
  );
};

export default AdminDisbursePayments;
