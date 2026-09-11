import React from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { maskAccountNumber } from '../utils/idGenerator';

export const PaymentSlipModal = ({ booking, onClose }) => {
  const { t } = useLanguage();

  if (!booking) return null;

  const maskedAcc = maskAccountNumber(booking.accountNumber);
  const paymentId = booking.paymentId || 'PAY-892144';
  const paymentDate = booking.paymentDate || '10 September 2026';
  const finalQty = booking.finalQuantity || booking.quantity;
  const rate = booking.approvedRate || 25;
  const totalAmount = booking.totalAmount || (finalQty * rate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const isCash = booking.paymentMode === 'Cash';
    const slipText = `
==================================================
           KISAN PROCUREMENT PORTAL
         CROP SALE PAYMENT RECEIPT
==================================================

Selling ID     : ${booking.sellingId}
Farmer ID Card : ${booking.farmerIdCard || '10020030040'}
Farmer Name    : ${booking.farmerName}
Crop           : ${booking.crop}
Quantity       : ${finalQty} ${booking.unit}
Approved Rate  : ₹${rate}/${booking.unit}

TOTAL AMOUNT   : ₹${totalAmount.toLocaleString('en-IN')}
Payment Mode   : ${isCash ? 'Cash at Mandi Counter' : 'Online Direct Bank Transfer (DBT)'}
Payment Status : PAID
Payment Date   : ${paymentDate}
${isCash ? `Cash Voucher No: ${paymentId}` : `Transaction ID : ${paymentId}`}
${booking.razorpayPayoutId ? `Razorpay Payout: ${booking.razorpayPayoutId}\nBank UTR Ref   : ${booking.utrNumber || 'RZP9876543210'}` : ''}

${isCash ? `CASH DISBURSEMENT DETAILS:
Disbursed At   : APMC Mandi Cash Counter Desk #1
Disbursed By   : Authorized APMC Mandi Cashier
Voucher Status : Cash Handed Over & Receipt Acknowledged` : `BANK DISBURSEMENT DETAILS:
Bank Name      : ${booking.bankName || 'State Bank of India'}
Account Number : ${maskedAcc}
IFSC Code      : ${booking.ifscCode || 'SBIN0001234'}
Payment Rail   : ${booking.razorpayPayoutId ? 'RazorpayX Instant DBT (24x7 IMPS)' : 'Direct Bank Transfer (DBT)'}`}

==================================================
${isCash ? 'Notice: Official Mandi Cash Voucher. Cash handed over in person.' : 'Notice: Direct Bank Transfer (DBT) to registered farmer bank account completed. No cash transaction involved.'}
==================================================
Authorized Officer: Kisan Procurement Authority
    `.trim();

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment_Slip_${booking.sellingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>KISAN PORTAL</span>
            <h2 style={{ fontSize: '18px', color: 'var(--color-primary-dark)' }}>{t('receiptHeader')}</h2>
          </div>
          <button
            type="button"
            className="icon-btn no-print"
            style={{ color: 'var(--color-text-main)' }}
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* Paid Status Stamp */}
        <div style={{ backgroundColor: 'var(--color-secondary-bg)', border: '2px solid var(--color-primary)', borderRadius: '8px', padding: '14px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
            <CheckCircle size={20} color="var(--color-primary)" />
            {t('paymentPaid')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary-dark)', margin: '4px 0' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {t('paymentDate')}: <strong>{paymentDate}</strong>
          </div>
        </div>

        {/* Structured Details */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', marginBottom: '16px', backgroundColor: '#FAFCFA' }}>
          <div className="kv-row">
            <span className="kv-label">{t('sellingId')}:</span>
            <span className="kv-value" style={{ color: 'var(--color-primary-dark)' }}>{booking.sellingId}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('farmerIdCard') || 'Farmer ID Card'}:</span>
            <span className="kv-value" style={{ fontWeight: '700', fontFamily: 'monospace' }}>{booking.farmerIdCard || '10020030040'}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('farmer')}:</span>
            <span className="kv-value">{booking.farmerName}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('crop')}:</span>
            <span className="kv-value">{booking.crop}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('quantity')}:</span>
            <span className="kv-value">{finalQty} {booking.unit}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('approvedRate')}:</span>
            <span className="kv-value">₹{rate}/{booking.unit}</span>
          </div>
          <div className="kv-row" style={{ borderTop: '1.5px solid var(--color-border)', marginTop: '4px', paddingTop: '8px' }}>
            <span className="kv-label" style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{t('amount')}:</span>
            <span className="kv-value" style={{ color: 'var(--color-primary-dark)', fontSize: '18px' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('paymentMode') || 'Payment Mode'}:</span>
            <span className="kv-value" style={{ fontWeight: '800', color: booking.paymentMode === 'Cash' ? 'var(--color-accent-wheat)' : 'var(--color-primary-dark)' }}>
              {booking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Mandi Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online (Bank Transfer / DBT)')}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{booking.paymentMode === 'Cash' ? (t('cashVoucherNo') || 'Cash Voucher No:') : t('paymentId')}:</span>
            <span className="kv-value" style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>{paymentId}</span>
          </div>
          {booking.paymentMode === 'Cash' ? (
            <>
              <div className="kv-row">
                <span className="kv-label">{t('disbursementDesk') || 'Disbursement Desk'}:</span>
                <span className="kv-value" style={{ fontWeight: '700' }}>{t('mandiCashDesk') || 'APMC Mandi Cash Counter (Desk #1)'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('voucherStatus') || 'Voucher Status'}:</span>
                <span className="kv-value" style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>✓ {t('cashHandedOver') || 'Cash Handed Over'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="kv-row">
                <span className="kv-label">{t('bankName')}:</span>
                <span className="kv-value">{booking.bankName || 'State Bank of India'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('accountNumber')}:</span>
                <span className="kv-value" style={{ letterSpacing: '1px', fontWeight: 'bold' }}>{maskedAcc}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('ifscCode')}:</span>
                <span className="kv-value">{booking.ifscCode || 'SBIN0001234'}</span>
              </div>
              {booking.razorpayPayoutId && (
                <div className="kv-row" style={{ backgroundColor: '#F0F9FF', padding: '4px 8px', borderRadius: '4px', margin: '4px 0' }}>
                  <span className="kv-label" style={{ color: '#0369A1', fontWeight: '700' }}>Razorpay Payout ID:</span>
                  <span className="kv-value" style={{ fontFamily: 'monospace', color: '#0C2340', fontWeight: '800' }}>{booking.razorpayPayoutId}</span>
                </div>
              )}
              {booking.utrNumber && (
                <div className="kv-row" style={{ backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '4px', margin: '4px 0' }}>
                  <span className="kv-label" style={{ color: '#15803D', fontWeight: '700' }}>Bank UTR / Ref No:</span>
                  <span className="kv-value" style={{ fontFamily: 'monospace', color: '#166534', fontWeight: '800' }}>{booking.utrNumber}</span>
                </div>
              )}
              <div className="kv-row">
                <span className="kv-label">{t('paymentRail') || 'Payment Rail'}:</span>
                <span className="kv-value" style={{ color: '#0284C7', fontWeight: '700' }}>
                  {booking.razorpayPayoutId ? (t('rzpPayoutRail') || 'RazorpayX Instant DBT (24x7 IMPS)') : (t('rbidbtRail') || 'RBI / NPCI Direct Bank Transfer')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Security / DBT Guarantee Note */}
        <div className="info-banner-wheat info-banner" style={{ fontSize: '13px', marginBottom: '16px' }}>
          <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
          <strong>{booking.paymentMode === 'Cash' ? (t('voucherStatus') || 'Cash Voucher Receipt:') : 'Direct Benefit Transfer (DBT):'}</strong> {booking.paymentMode === 'Cash' ? (t('cashReceiptNotice') || 'Official cash payout acknowledged and issued at APMC Mandi counter.') : (t('dbtReceiptNotice') || t('receiptNotice'))}
        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button type="button" className="btn btn-outline-primary" onClick={handlePrint}>
            <Printer size={18} />
            {t('printSlipBtn')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            <Download size={18} />
            {t('downloadSlipBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSlipModal;
