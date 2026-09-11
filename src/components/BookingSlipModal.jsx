import React from 'react';
import { Printer, Download, X, CheckCircle, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BookingSlipModal = ({ booking, onClose }) => {
  const { t } = useLanguage();

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const slipText = `
==================================================
           KISAN PROCUREMENT PORTAL
         CROP SELLING BOOKING SLIP
==================================================

Selling ID   : ${booking.sellingId}
Centre Token : ${booking.centreToken || booking.tokenNumber || '1'}
Farmer ID Card: ${booking.farmerIdCard || '10020030040'}
Farmer Name  : ${booking.farmerName}
Mobile       : +91 ${booking.mobileNumber}
Village      : ${booking.village || 'N/A'}, ${booking.district || ''}

CROP DETAILS:
Crop         : ${booking.crop}
Variety      : ${booking.variety || 'Standard'}
Quantity     : ${booking.quantity} ${booking.unit}

APPOINTMENT & QUEUE DETAILS:
Procurement  : ${booking.centre}
Date         : ${booking.date}
Session      : ${booking.timeSlot} (2-Hour Duration)
Queue Token  : ${booking.centreToken || ('Token #' + (booking.tokenNumber || 1))}
Estimated Turn: ${booking.estimatedTurnTime || 'Scheduled in session'}
Recommended Arrival: ${booking.recommendedArrivalTime || booking.reportGateTime || '10 min prior'}
Status       : ${booking.status}
Payment Mode : ${booking.paymentMode === 'Cash' ? 'Cash at Mandi Counter' : 'Online Direct Bank Transfer (DBT)'}

IMPORTANT NOTICE:
Please show this Selling ID and Centre Token at the gate.
Standard processing time is 15 minutes per farmer.
${booking.paymentMode === 'Cash' ? 'Cash voucher will be disbursed directly at the Mandi Cash Counter upon weighing.' : 'Payment will be deposited directly into your registered bank account.'}

==================================================
Computer-generated slip • Kisan Portal
==================================================
    `.trim();

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Booking_Slip_${booking.sellingId}.txt`;
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
            <h2 style={{ fontSize: '18px', color: 'var(--color-primary-dark)' }}>{t('bookingSlipHeader')}</h2>
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

        {/* Success Banner */}
        <div style={{ backgroundColor: 'var(--color-secondary-bg)', border: '1.5px solid var(--color-primary)', borderRadius: '6px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
          <CheckCircle size={28} color="var(--color-primary)" style={{ display: 'inline-block', marginBottom: '4px' }} />
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{t('sellingId')}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary-dark)', letterSpacing: '1px', marginTop: '2px' }}>
            {booking.sellingId}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-primary-dark)', marginTop: '4px', fontWeight: '600' }}>
            {t('bookingSuccessMsg')}
          </div>
        </div>

        {/* Details Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', marginBottom: '16px', backgroundColor: '#FAFCFA' }}>
          <div className="kv-row">
            <span className="kv-label">{t('farmerIdCard') || 'Farmer ID Card'}:</span>
            <span className="kv-value" style={{ fontWeight: '700', color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
              {booking.farmerIdCard || '10020030040'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('fullName')}:</span>
            <span className="kv-value">{booking.farmerName}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('mobileNumber')}:</span>
            <span className="kv-value">+91 {booking.mobileNumber}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('crop')}:</span>
            <span className="kv-value">{booking.crop}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('quantity')}:</span>
            <span className="kv-value">{booking.quantity} {booking.unit}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('procurementCentre')}:</span>
            <span className="kv-value">{booking.centre}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('date')}:</span>
            <span className="kv-value">{booking.date}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">{t('timeSlot')}:</span>
            <span className="kv-value" style={{ color: 'var(--color-primary-dark)' }}>{booking.timeSlot}</span>
          </div>
          <div className="kv-row" style={{ backgroundColor: 'var(--color-secondary-bg)', padding: '6px 8px', borderRadius: '4px' }}>
            <span className="kv-label" style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{t('centreToken') || 'Centre Token'}:</span>
            <span className="kv-value" style={{ fontWeight: '800', color: 'var(--color-primary-dark)', fontSize: '17px' }}>
              {booking.centreToken || ('Token #' + (booking.tokenNumber || 1))}
            </span>
          </div>
          {booking.estimatedTurnTime && (
            <div className="kv-row">
              <span className="kv-label">{t('estimatedTurnTimeLabel') || 'Estimated Turn Time'}:</span>
              <span className="kv-value">{booking.estimatedTurnTime} ({t('perFarmerTurn') || '~15 min/farmer'})</span>
            </div>
          )}
          <div className="kv-row">
            <span className="kv-label" style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{t('recommendedGateArrivalLabel') || 'Recommended Gate Arrival'}:</span>
            <span className="kv-value" style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
              {booking.recommendedArrivalTime || booking.reportGateTime || t('tenMinPrior') || '10 min prior'}
            </span>
          </div>
          <div className="kv-row" style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '6px', marginTop: '6px' }}>
            <span className="kv-label" style={{ fontWeight: 'bold' }}>{t('paymentMode') || 'Payment Mode'}:</span>
            <span className="kv-value" style={{ fontWeight: '800', color: booking.paymentMode === 'Cash' ? 'var(--color-accent-wheat)' : 'var(--color-primary-dark)' }}>
              {booking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online (Bank Transfer / DBT)')}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="info-banner" style={{ fontSize: '13px', marginBottom: '16px' }}>
          <strong>⚠️ {t('quickGuidance')}:</strong> {t('slipGuidance') || `Show your Selling ID (${booking.sellingId}) and Centre Token (${booking.centreToken || ('Token #' + (booking.tokenNumber || 1))}) at the gate. Standard processing is 15 minutes per farmer.`}
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

export default BookingSlipModal;
