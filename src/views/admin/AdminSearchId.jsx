import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, ArrowRight, ShieldCheck, Printer, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import { maskAccountNumber } from '../../utils/idGenerator';
import PaymentSlipModal from '../../components/PaymentSlipModal';
import BookingSlipModal from '../../components/BookingSlipModal';
import RazorpayModal from '../../components/RazorpayModal';

const LIFECYCLE_STAGES = [
  'Booked',
  'Arrived',
  'Crop Verified',
  'Weighed',
  'Sale Completed'
];

export const AdminSearchId = ({ initialSellingId = '' }) => {
  const { t } = useLanguage();
  const { bookings, updateBookingStatus, processFarmerPayment, findBookingBySellingId, liveServingTokens, advanceQueueToken } = usePortalData();

  const [searchId, setSearchId] = useState(initialSellingId || '');
  const [activeBooking, setActiveBooking] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Payment form state
  const [weighedQty, setWeighedQty] = useState('');
  const [approvedRate, setApprovedRate] = useState('25');
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  const [showPaymentSlip, setShowPaymentSlip] = useState(false);
  const [showBookingSlip, setShowBookingSlip] = useState(false);

  // Sync initial search
  useEffect(() => {
    if (initialSellingId) {
      setSearchId(initialSellingId);
      performSearch(initialSellingId);
    } else if (searchId) {
      performSearch(searchId);
    }
  }, [initialSellingId, bookings]);

  const performSearch = (idToSearch) => {
    setSearchError('');
    const found = findBookingBySellingId(idToSearch);
    if (found) {
      setActiveBooking(found);
      setWeighedQty(String(found.finalQuantity || found.quantity || ''));
      setApprovedRate(String(found.approvedRate || '25'));
    } else {
      setActiveBooking(null);
      if (idToSearch.trim()) {
        setSearchError(t('sellingIdNotFound'));
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchId);
  };

  // Advance lifecycle stage (Section 16)
  const handleAdvanceStatus = () => {
    if (!activeBooking) return;
    const currentIndex = LIFECYCLE_STAGES.indexOf(activeBooking.status);
    if (currentIndex < LIFECYCLE_STAGES.length - 1) {
      const nextStatus = LIFECYCLE_STAGES[currentIndex + 1];
      updateBookingStatus(activeBooking.sellingId, nextStatus);
    }
  };

  // Process Farmer Direct Payment (Section 17)
  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!activeBooking) return;

    if (activeBooking.paymentMode === 'Cash') {
      // Cash at Mandi Counter
      processFarmerPayment(activeBooking.sellingId, weighedQty, approvedRate, { paymentMode: 'Cash' });
      setPaymentSuccessNotice(true);
      setTimeout(() => setPaymentSuccessNotice(false), 4000);
    } else {
      // Online DBT: Trigger Razorpay API Payout Gateway
      setShowRazorpayModal(true);
    }
  };

  const handleRazorpaySuccess = (result) => {
    if (!activeBooking) return;
    processFarmerPayment(activeBooking.sellingId, weighedQty, approvedRate, result);
    setShowRazorpayModal(false);
    setPaymentSuccessNotice(true);
    setTimeout(() => setPaymentSuccessNotice(false), 5000);
  };

  const calculatedTotal = (Number(weighedQty) || 0) * (Number(approvedRate) || 0);

  return (
    <div>
      <h1 className="page-title">{t('adminNavSearch')}</h1>
      <p className="subtitle">Search and manage farmer crop selling record by unique Selling ID</p>

      {/* Search Input Card (Section 15) */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <label className="form-label" htmlFor="sellingIdSearch">
          {t('sellingId')}
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            id="sellingIdSearch"
            type="text"
            className="form-input"
            style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '1px', textTransform: 'uppercase', borderColor: '#93C5FD' }}
            placeholder={t('searchSellingIdPlaceholder')}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-blue" style={{ width: 'auto', minWidth: '130px' }}>
            <Search size={18} />
            {t('search')}
          </button>
        </div>
      </form>

      {searchError && (
        <div className="info-banner-warning info-banner">{searchError}</div>
      )}

      {!activeBooking && !searchError && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
          <Search size={36} color="#2563EB" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '17px', color: '#0F172A', marginBottom: '6px', fontWeight: '700' }}>Enter a Selling ID to Search</h3>
          <p style={{ fontSize: '14px' }}>
            When a farmer arrives at the procurement centre, enter their unique Selling ID above to view details, record weighing, and disburse payments.
          </p>
        </div>
      )}

      {activeBooking && (
        <div>
          {/* Status Progression Bar (Section 16) */}
          <div className="card card-blue" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: '700' }}>CROP SELLING PROCESS:</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E3A8A' }}>
                  {activeBooking.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline-blue btn-small"
                  onClick={() => setShowBookingSlip(true)}
                >
                  <FileText size={15} />
                  Booking Slip
                </button>
                {activeBooking.paymentStatus === 'Paid' && (
                  <button
                    type="button"
                    className="btn btn-blue btn-small"
                    onClick={() => setShowPaymentSlip(true)}
                  >
                    <CheckCircle size={15} />
                    Payment Slip
                  </button>
                )}
              </div>
            </div>

            {/* Visual stage stepper (Multi-Color Theme) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const currentIdx = LIFECYCLE_STAGES.indexOf(activeBooking.status);
                const isPassed = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                let bg = 'var(--color-slate-100)';
                let textColor = 'var(--color-text-muted)';
                let border = '1px solid var(--color-border)';

                if (isPassed) {
                  bg = 'var(--color-green)';
                  textColor = '#FFFFFF';
                  border = '1px solid var(--color-green-dark)';
                } else if (isCurrent) {
                  bg = '#2563EB';
                  textColor = '#FFFFFF';
                  border = '2px solid #1D4ED8';
                }

                return (
                  <div
                    key={stage}
                    style={{
                      padding: '10px 8px',
                      backgroundColor: bg,
                      color: textColor,
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: isCurrent || isPassed ? '800' : '500',
                      border: border,
                      boxShadow: isCurrent ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isPassed ? '✓ ' : ''}{idx + 1}. {stage}
                  </div>
                );
              })}
            </div>

            {/* Advance Status Button */}
            {activeBooking.status !== 'Sale Completed' && (
              <button
                type="button"
                className="btn btn-blue"
                onClick={handleAdvanceStatus}
              >
                <ArrowRight size={18} />
                Advance Status to: {LIFECYCLE_STAGES[LIFECYCLE_STAGES.indexOf(activeBooking.status) + 1]}
              </button>
            )}
          </div>

          {/* 5 Dossier Sections (Section 15) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* 1. FARMER DETAILS */}
            <div className="card" style={{ borderTop: '4px solid #2563EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 className="section-title" style={{ color: '#1E40AF', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '6px' }}>
                👤 {t('farmerSection')}
              </h2>
              <div className="kv-row">
                <span className="kv-label">{t('farmerIdCard') || 'Farmer ID Card'}:</span>
                <span className="kv-value" style={{ fontWeight: '700', color: '#1D4ED8', fontFamily: 'monospace' }}>
                  {activeBooking.farmerIdCard || '10020030040'}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('fullName')}:</span>
                <span className="kv-value">{activeBooking.farmerName}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('mobileNumber')}:</span>
                <span className="kv-value">+91 {activeBooking.mobileNumber}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('village')}:</span>
                <span className="kv-value">{activeBooking.village || 'Anandpur'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('district')}:</span>
                <span className="kv-value">{activeBooking.district || 'Anand'}</span>
              </div>
            </div>

            {/* 2. CROP DETAILS */}
            <div className="card" style={{ borderTop: '4px solid #059669', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 className="section-title" style={{ color: '#047857', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '6px' }}>
                🌾 {t('cropSection')}
              </h2>
              <div className="kv-row">
                <span className="kv-label">{t('cropName')}:</span>
                <span className="kv-value">{activeBooking.crop}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('cropVariety')}:</span>
                <span className="kv-value">{activeBooking.variety || 'Standard'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('quantity')}:</span>
                <span className="kv-value">{activeBooking.quantity} {activeBooking.unit}</span>
              </div>
            </div>

            {/* 3. BOOKING DETAILS */}
            <div className="card" style={{ borderTop: '4px solid #4F46E5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 className="section-title" style={{ color: '#4338CA', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '6px' }}>
                📅 {t('bookingSection')}
              </h2>
              <div className="kv-row">
                <span className="kv-label">{t('sellingId')}:</span>
                <span className="kv-value" style={{ color: '#1E40AF', fontWeight: 'bold' }}>{activeBooking.sellingId}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('procurementCentre')}:</span>
                <span className="kv-value">{activeBooking.centre}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('date')}:</span>
                <span className="kv-value">{activeBooking.date}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('timeSlot')}:</span>
                <span className="kv-value">{activeBooking.timeSlot}</span>
              </div>
              <div className="kv-row" style={{ backgroundColor: '#EEF2FF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #C7D2FE' }}>
                <span className="kv-label" style={{ fontWeight: 'bold', color: '#3730A3' }}>Queue Token:</span>
                <span className="kv-value" style={{ fontWeight: '800', color: '#4338CA' }}>
                  Token #{activeBooking.tokenNumber || 1} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>of 30</span>
                </span>
              </div>
              {activeBooking.estimatedTurnTime && (
                <div className="kv-row">
                  <span className="kv-label">Estimated Turn:</span>
                  <span className="kv-value">{activeBooking.estimatedTurnTime}</span>
                </div>
              )}
              {activeBooking.reportGateTime && (
                <div className="kv-row">
                  <span className="kv-label" style={{ color: 'var(--color-danger)' }}>Report Gate (5 min prior):</span>
                  <span className="kv-value" style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                    {activeBooking.reportGateTime}
                  </span>
                </div>
              )}

              {/* Mandi Counter Queue Control */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Mandi Counter Serving:</span>
                  <span className="badge badge-paid">
                    Token #{liveServingTokens[activeBooking.timeSlot] || 1}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-blue btn-small"
                  style={{ width: '100%', fontSize: '13px' }}
                  onClick={() => advanceQueueToken(activeBooking.timeSlot)}
                >
                  📢 Call Next Token (Token #{(liveServingTokens[activeBooking.timeSlot] || 1) + 1})
                </button>
              </div>
            </div>

            {/* 4. PAYMENT COLLECTION & BANK DETAILS */}
            <div className="card" style={{ borderTop: '4px solid #D97706', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 className="section-title" style={{ color: '#B45309', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '6px' }}>
                💳 {t('paymentMode') || 'Payment Collection Mode'} & Details
              </h2>
              <div className="kv-row" style={{ backgroundColor: activeBooking.paymentMode === 'Cash' ? 'var(--color-accent-bg)' : 'var(--color-secondary-bg)', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                <span className="kv-label" style={{ fontWeight: 'bold' }}>{t('paymentMode') || 'Selected Mode'}:</span>
                <span className="kv-value" style={{ fontWeight: '800', fontSize: '15px', color: activeBooking.paymentMode === 'Cash' ? 'var(--color-accent-wheat)' : 'var(--color-primary-dark)' }}>
                  {activeBooking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Mandi Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online (Bank Transfer / DBT)')}
                </span>
              </div>
              {activeBooking.paymentMode === 'Cash' ? (
                <>
                  <div className="kv-row">
                    <span className="kv-label">Disbursement Point:</span>
                    <span className="kv-value" style={{ fontWeight: '700' }}>APMC Mandi Cash Counter Desk #1</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Collection Method:</span>
                    <span className="kv-value">Physical Cash Handover with Cash Voucher Receipt</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="kv-row">
                    <span className="kv-label">{t('bankName')}:</span>
                    <span className="kv-value">{activeBooking.bankName || 'State Bank of India'}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">{t('accountHolder')}:</span>
                    <span className="kv-value">{activeBooking.farmerName}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">{t('accountNumber')}:</span>
                    <span className="kv-value" style={{ letterSpacing: '1px', fontWeight: 'bold' }}>
                      {maskAccountNumber(activeBooking.accountNumber)}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">{t('ifscCode')}:</span>
                    <span className="kv-value">{activeBooking.ifscCode || 'SBIN0001234'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 5. PAYMENT & DISBURSEMENT SECTION (Section 17) */}
          <div className={`card ${activeBooking.paymentStatus === 'Paid' ? 'card-green' : activeBooking.paymentMode === 'Cash' ? 'card-amber' : 'card-blue'}`} style={{ padding: '20px', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ color: activeBooking.paymentStatus === 'Paid' ? 'var(--color-green-dark)' : 'var(--color-blue-dark)', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '6px' }}>
              {t('paymentSection')} & DISBURSEMENT ({activeBooking.paymentMode === 'Cash' ? 'CASH' : 'ONLINE DBT'})
            </h2>

            {paymentSuccessNotice && (
              <div className="info-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CheckCircle size={20} color="var(--color-green)" />
                <span>{activeBooking.paymentMode === 'Cash' ? 'Cash payout voucher issued and recorded successfully!' : t('paymentSuccessNotice')}</span>
              </div>
            )}

            <div className={activeBooking.paymentMode === 'Cash' ? 'info-banner-orange' : 'info-banner-blue'} style={{ fontSize: '13px', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px' }}>
              <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
              {activeBooking.paymentMode === 'Cash'
                ? 'CASH DISBURSEMENT MODE: An official cash voucher will be generated for payment at the APMC Mandi Cash Counter.'
                : t('demoPaymentBanner')}
            </div>

            {activeBooking.paymentStatus === 'Paid' ? (
              <div>
                <div style={{ backgroundColor: '#F0FDF4', padding: '18px', borderRadius: '10px', border: '2px solid var(--color-green-border)', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-green)', fontWeight: '800', textTransform: 'uppercase' }}>
                    ✓ {t('paymentPaid')}
                  </div>
                  <div style={{ fontSize: '34px', fontWeight: '900', color: 'var(--color-green)', margin: '4px 0' }}>
                    ₹{(activeBooking.totalAmount || 12500).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Payment Ref ID: <strong style={{ color: 'var(--color-blue-dark)' }}>{activeBooking.paymentId || 'PAY-892144'}</strong> • Date: {activeBooking.paymentDate || '10 September 2026'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-blue"
                    onClick={() => setShowPaymentSlip(true)}
                  >
                    <Printer size={18} />
                    {t('viewPaymentSlip')} / {t('print')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '14px' }}>
                      {t('finalQuantity')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={weighedQty}
                      onChange={(e) => setWeighedQty(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '14px' }}>
                      {t('enterRatePerKg')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={approvedRate}
                      onChange={(e) => setApprovedRate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '14px' }}>
                      {t('calculatedAmount')}
                    </label>
                    <div style={{
                      height: 'var(--input-height)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #BFDBFE',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '800',
                      fontSize: '18px',
                      color: '#1E40AF'
                    }}>
                      ₹{calculatedTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn ${activeBooking.paymentMode === 'Cash' ? 'btn-amber' : 'btn-purple'}`}
                  style={{
                    height: '52px',
                    fontSize: '17px',
                    width: '100%',
                    fontWeight: '700'
                  }}
                >
                  <ShieldCheck size={20} />
                  {activeBooking.paymentMode === 'Cash'
                    ? `${t('disburseCash') || 'Disburse Cash at Counter'} (₹${calculatedTotal.toLocaleString('en-IN')})`
                    : `${t('disburseOnline') || 'Disburse via Online DBT (Razorpay)'} (₹${calculatedTotal.toLocaleString('en-IN')})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Slips */}
      {showBookingSlip && activeBooking && (
        <BookingSlipModal
          booking={activeBooking}
          onClose={() => setShowBookingSlip(false)}
        />
      )}
      {showPaymentSlip && activeBooking && (
        <PaymentSlipModal
          booking={activeBooking}
          onClose={() => setShowPaymentSlip(false)}
        />
      )}

      {/* Razorpay Online DBT API Gateway Modal */}
      {showRazorpayModal && activeBooking && (
        <RazorpayModal
          booking={activeBooking}
          weighedQty={weighedQty}
          approvedRate={approvedRate}
          totalAmount={calculatedTotal}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayModal(false)}
        />
      )}
    </div>
  );
};

export default AdminSearchId;
