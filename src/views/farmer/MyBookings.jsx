import React, { useState } from 'react';
import { Calendar, FileText, CheckCircle, Clock, Users, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import BookingSlipModal from '../../components/BookingSlipModal';
import PaymentSlipModal from '../../components/PaymentSlipModal';
import SlotQueueModal from '../../components/SlotQueueModal';
import MissedSlotModal from '../../components/MissedSlotModal';
import { generateCentreToken } from '../../utils/smartQueueEngine';

export const MyBookings = ({ onNavigateToSell }) => {
  const { t } = useLanguage();
  const { bookings, farmerBookings, farmerMobile, farmerProfile } = usePortalData();

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState(null);
  const [selectedQueueBooking, setSelectedQueueBooking] = useState(null);
  const [missedSlotBooking, setMissedSlotBooking] = useState(null);

  // Strictly isolate to the currently logged in farmer's personal bookings
  const myBookings = farmerBookings || (bookings || []).filter(b => b.mobileNumber === (farmerMobile || farmerProfile.mobileNumber));

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked': return 'badge badge-booked';
      case 'Arrived': return 'badge badge-arrived';
      case 'Crop Verified': return 'badge badge-verified';
      case 'Weighed': return 'badge badge-weighed';
      case 'Sale Completed': return 'badge badge-completed';
      default: return 'badge badge-booked';
    }
  };

  const getPaymentBadgeClass = (pStatus) => {
    switch (pStatus) {
      case 'Paid': return 'badge badge-paid';
      case 'Processing': return 'badge badge-arrived';
      case 'Pending': return 'badge badge-pending';
      default: return 'badge badge-pending';
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">{t('myBookings')}</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            {myBookings.length} {t('myBookings')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-gradient btn-small"
          onClick={onNavigateToSell}
        >
          + {t('sellCrop')}
        </button>
      </div>

      {myBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <Calendar size={36} color="#2563EB" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            {t('noActiveBookings')}
          </p>
          <button type="button" className="btn btn-gradient" onClick={onNavigateToSell}>
            {t('bookCropSlotBtn')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myBookings.map((b) => (
            <div key={b.id || b.sellingId} className="card" style={{ padding: '16px', borderTop: '4px solid #2563EB', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)' }}>
              {/* Card Header: Selling ID + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1E40AF' }}>
                  {b.sellingId}
                </span>
                <span className={getStatusBadgeClass(b.status)}>
                  {t('status' + b.status.replace(/\s+/g, '')) || b.status}
                </span>
              </div>

              {/* Card Body Key-Values */}
              <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '8px 0', margin: '8px 0' }}>
                <div className="kv-row">
                  <span className="kv-label">{t('crop')}:</span>
                  <span className="kv-value">{b.crop} ({b.variety || 'Standard'})</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('quantity')}:</span>
                  <span className="kv-value">{b.quantity} {b.unit}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('procurementCentre')}:</span>
                  <span className="kv-value" style={{ fontWeight: '600' }}>{b.centre || 'APMC Mandi Main Yard'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('date')}:</span>
                  <span className="kv-value">{b.date}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('time')}:</span>
                  <span className="kv-value">{b.timeSlot}</span>
                </div>
                <div className="kv-row" style={{ backgroundColor: 'var(--color-blue-bg)', border: '1px solid var(--color-blue-border)', padding: '8px 10px', borderRadius: '6px' }}>
                  <span className="kv-label" style={{ fontWeight: 'bold', color: 'var(--color-blue-dark)' }}>{t('centreToken') || 'Centre Token'}:</span>
                  <span className="kv-value" style={{ fontWeight: '900', color: 'var(--color-blue)', fontSize: '15px' }}>
                    {b.centreToken || generateCentreToken(b.centreId || 'apmc-main', b.tokenNumber || 1)} (Slot #{b.tokenNumber || 1} of 8)
                  </span>
                </div>
                {b.estimatedTurnTime && (
                  <div className="kv-row">
                    <span className="kv-label">{t('expectedTurnLabel') || 'Estimated Turn'}:</span>
                    <span className="kv-value" style={{ color: 'var(--color-blue-dark)', fontWeight: '600' }}>
                      {b.estimatedTurnTime} ({t('perFarmerTurn') || '~15 min/farmer'})
                    </span>
                  </div>
                )}
                <div className="kv-row">
                  <span className="kv-label" style={{ color: 'var(--color-amber-dark)', fontWeight: 'bold' }}>{t('recommendedArrival') || 'Recommended Arrival'}:</span>
                  <span className="kv-value" style={{ color: 'var(--color-amber-dark)', fontWeight: 'bold' }}>
                    {b.recommendedArrivalTime || b.reportGateTime || t('tenMinPrior') || '10 min prior'}
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('paymentStatus')}:</span>
                  <span className="kv-value">
                    <span className={getPaymentBadgeClass(b.paymentStatus)}>
                      {t('payment' + b.paymentStatus) || b.paymentStatus}
                    </span>
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">{t('paymentMode') || 'Payment Mode'}:</span>
                  <span className="kv-value" style={{ fontWeight: '700', color: b.paymentMode === 'Cash' ? 'var(--color-amber-dark)' : 'var(--color-blue)' }}>
                    {b.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online DBT')}
                  </span>
                </div>
              </div>

              {/* Actions (Multi-Color) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline-blue btn-small"
                  onClick={() => setSelectedQueueBooking(b)}
                  style={{ fontWeight: 'bold' }}
                >
                  <Users size={15} />
                  {t('viewLiveQueueBtn') || 'Live Queue'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-blue btn-small"
                  onClick={() => setSelectedSlip(b)}
                >
                  <FileText size={15} />
                  {t('downloadBookingSlip')}
                </button>
                {b.status !== 'Sale Completed' && (
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    style={{ fontWeight: 'bold' }}
                    onClick={() => setMissedSlotBooking(b)}
                  >
                    <RefreshCw size={14} />
                    {t('missedSlot') || 'Missed Slot?'}
                  </button>
                )}
              </div>
              {b.paymentStatus === 'Paid' && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-blue btn-small"
                    style={{ width: '100%' }}
                    onClick={() => setSelectedPaymentSlip(b)}
                  >
                    <CheckCircle size={15} />
                    {t('viewPaymentSlip')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slips & Live Queue Modal */}
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
      {selectedQueueBooking && (
        <SlotQueueModal
          centreId={selectedQueueBooking.centreId}
          sessionId={selectedQueueBooking.sessionId}
          date={selectedQueueBooking.date}
          timeSlot={selectedQueueBooking.timeSlot}
          centre={selectedQueueBooking.centre}
          cropInfo={{
            crop: selectedQueueBooking.crop,
            variety: selectedQueueBooking.variety,
            quantity: selectedQueueBooking.quantity,
            unit: selectedQueueBooking.unit
          }}
          currentBooking={selectedQueueBooking}
          isModal={true}
          onClose={() => setSelectedQueueBooking(null)}
        />
      )}
      {missedSlotBooking && (
        <MissedSlotModal
          booking={missedSlotBooking}
          onClose={() => setMissedSlotBooking(null)}
          onSuccess={(rebooked) => {
            setMissedSlotBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;
