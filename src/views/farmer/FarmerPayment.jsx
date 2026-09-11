import React, { useState } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import PaymentSlipModal from '../../components/PaymentSlipModal';
import { maskAccountNumber } from '../../utils/idGenerator';

export const FarmerPayment = () => {
  const { t } = useLanguage();
  const { bookings, farmerBookings, bankDetails, farmerMobile, farmerProfile } = usePortalData();

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Strictly isolate to the currently logged in farmer's personal bookings
  const myBookings = farmerBookings || (bookings || []).filter(b => b.mobileNumber === (farmerMobile || farmerProfile.mobileNumber));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="badge badge-paid">✓ {t('paymentPaid') || 'Paid'}</span>;
      case 'Processing':
        return <span className="badge badge-pending">⏱️ {t('paymentProcessing') || 'Processing'}</span>;
      case 'Failed':
        return <span className="badge badge-failed">⚠️ {t('paymentFailed') || 'Failed'}</span>;
      default:
        return <span className="badge badge-pending">⏳ {t('paymentPending') || 'Pending'}</span>;
    }
  };

  return (
    <div className="main-content">
      <h1 className="page-title">{t('farmerPaymentTitle')}</h1>
      <p className="subtitle">{t('farmerPaymentSubtitle')}</p>

      {/* Direct Credit Account Banner (Blue Theme) */}
      <div className="card card-blue" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-blue-dark)', fontWeight: 'bold', textTransform: 'uppercase' }}>
          🏦 {t('maskedAccount')}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-blue)', letterSpacing: '0.5px', marginTop: '4px' }}>
          {bankDetails.accountNumber ? `${bankDetails.bankName || 'Bank'} • ${maskAccountNumber(bankDetails.accountNumber)}` : 'No Bank Account Registered Yet'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-blue-dark)', fontWeight: '600', marginTop: '4px' }}>
          ✓ {t('dbtVerifiedBadge') || 'Verified for Direct Government APMC Mandi DBT Transfer via Razorpay Payouts'}
        </div>
      </div>

      {myBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <CreditCard size={36} color="var(--color-blue)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>{t('noActiveBookings')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myBookings.map((booking) => {
            const finalQty = booking.finalQuantity || booking.quantity;
            const rate = booking.approvedRate || 25;
            const total = booking.totalAmount || (finalQty * rate);
            const isPaid = booking.paymentStatus === 'Paid';
            const isFailed = booking.paymentStatus === 'Failed';

            return (
              <div key={booking.id || booking.sellingId} className={`card ${isPaid ? 'card-green' : isFailed ? 'card-red' : ''}`} style={{ padding: '16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('sellingId')}</span>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: isPaid ? 'var(--color-green-dark)' : 'var(--color-primary-dark)' }}>
                      {booking.sellingId}
                    </div>
                  </div>
                  <div>{getStatusBadge(booking.paymentStatus)}</div>
                </div>

                {/* Amount Highlight */}
                <div style={{
                  backgroundColor: isPaid ? '#F0FDF4' : isFailed ? '#FEF2F2' : '#FFFBEB',
                  border: isPaid ? '1px solid var(--color-green-border)' : isFailed ? '1px solid var(--color-red-border)' : '1px solid var(--color-amber-border)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: isPaid ? 'var(--color-green-dark)' : 'var(--color-text-muted)', fontWeight: 'bold' }}>{t('amount')}</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: isPaid ? 'var(--color-green)' : isFailed ? 'var(--color-red)' : 'var(--color-amber-dark)' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600' }}>
                    {finalQty} {booking.unit} × ₹{rate}/{booking.unit}
                  </div>
                </div>

                {/* Key Details */}
                <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '8px 0', margin: '8px 0' }}>
                  <div className="kv-row">
                    <span className="kv-label">{t('crop')}:</span>
                    <span className="kv-value">{booking.crop}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">{t('paymentMode') || 'Payment Mode'}:</span>
                    <span className="kv-value" style={{ fontWeight: '800', color: booking.paymentMode === 'Cash' ? 'var(--color-accent-wheat)' : 'var(--color-primary-dark)' }}>
                      {booking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online DBT')}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">{t('paymentStatus')}:</span>
                    <span className="kv-value" style={{ fontWeight: '700' }}>
                      {t('payment' + booking.paymentStatus) || booking.paymentStatus}
                    </span>
                  </div>
                  {booking.paymentStatus === 'Paid' && (
                    <>
                      <div className="kv-row">
                        <span className="kv-label">{t('paymentDate')}:</span>
                        <span className="kv-value">{booking.paymentDate || '10 September 2026'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">{booking.paymentMode === 'Cash' ? (t('cashVoucherNo') || 'Cash Voucher No:') : t('paymentId')}:</span>
                        <span className="kv-value" style={{ fontFamily: 'monospace' }}>
                          {booking.paymentId || 'PAY-892144'}
                        </span>
                      </div>
                    </>
                  )}
                  {booking.paymentMode === 'Cash' && booking.paymentStatus !== 'Paid' && (
                    <div className="kv-row">
                      <span className="kv-label">{t('collectionPoint') || 'Collection Point'}:</span>
                      <span className="kv-value" style={{ color: 'var(--color-accent-wheat)', fontWeight: 'bold' }}>
                        {t('mandiCashDesk') || 'APMC Mandi Cash Counter (Desk #1)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Button */}
                {booking.paymentStatus === 'Paid' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    style={{ marginTop: '10px', width: '100%' }}
                    onClick={() => setSelectedReceipt(booking)}
                  >
                    <FileText size={16} />
                    {t('viewPaymentSlip')}
                  </button>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '6px', textAlign: 'center' }}>
                    ℹ️ {t('paymentPendingInfo')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slip Modal */}
      {selectedReceipt && (
        <PaymentSlipModal
          booking={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default FarmerPayment;
