import React, { useState } from 'react';
import { PlusCircle, Calendar, CreditCard, ChevronRight, FileText, CheckCircle, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import BookingSlipModal from '../../components/BookingSlipModal';
import PaymentSlipModal from '../../components/PaymentSlipModal';
import SlotQueueModal from '../../components/SlotQueueModal';
import MissedSlotModal from '../../components/MissedSlotModal';
import {
  getCentreConfig,
  calculateCentreLoad,
  generateCentreToken
} from '../../utils/smartQueueEngine';

export const FarmerDashboard = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { farmerProfile, farmerMobile, bookings, farmerBookings, liveServingTokens, getLiveServingToken } = usePortalData();

  const [selectedSlipBooking, setSelectedSlipBooking] = useState(null);
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState(null);
  const [selectedQueueBooking, setSelectedQueueBooking] = useState(null);
  const [missedSlotBooking, setMissedSlotBooking] = useState(null);

  // Strictly isolate to the currently logged in farmer's personal bookings
  const myBookings = farmerBookings || (bookings || []).filter(b => b.mobileNumber === (farmerMobile || farmerProfile.mobileNumber));
  const latestBooking = myBookings.length > 0 ? myBookings[0] : null;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked': return 'badge badge-booked';
      case 'Arrived': return 'badge badge-arrived';
      case 'Crop Verified': return 'badge badge-verified';
      case 'Weighed': return 'badge badge-weighed';
      case 'Sale Completed': return 'badge badge-completed';
      case 'Missed': return 'badge badge-booked';
      case 'Missed (Rebooked)': return 'badge badge-verified';
      default: return 'badge badge-booked';
    }
  };

  const getPaymentBadgeClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'Paid': return 'badge badge-paid';
      case 'Processing': return 'badge badge-arrived';
      case 'Pending': return 'badge badge-pending';
      default: return 'badge badge-pending';
    }
  };

  return (
    <div className="main-content">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '16px' }}>
        <h1 className="page-title">
          {t('welcome')}, {farmerProfile.fullName || t('farmer')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <p className="subtitle" style={{ margin: 0 }}>
            {farmerProfile.village ? `${farmerProfile.village}, ${farmerProfile.district}` : t('tagline')}
          </p>
          {(farmerProfile.farmerIdCard || latestBooking?.farmerIdCard) && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              color: '#1D4ED8',
              padding: '3px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              🪪 {t('farmerIdBadge') || 'ID'}: {farmerProfile.farmerIdCard || latestBooking?.farmerIdCard}
            </span>
          )}
        </div>
      </div>

      {/* Main Big Button - Book Crop Selling Slot (High-Impact Multi-Color Gradient) */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className="btn btn-gradient"
          style={{ height: '56px', fontSize: '18px', fontWeight: '800', letterSpacing: '0.3px' }}
          onClick={() => onNavigate('sell')}
        >
          <PlusCircle size={24} />
          {t('bookCropSlotBtn')}
        </button>
      </div>

      {/* Multi-Color Quick Status Pills / Metric Cards */}
      {latestBooking && (
        <div className="metrics-grid" style={{ marginBottom: '20px' }}>
          <div className="metric-card green-theme">
            <div className="metric-header">
              <span className="metric-label">{t('crop') || 'Active Crop'}</span>
              <div className="metric-icon-box green">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: '20px' }}>{latestBooking.crop}</div>
            <div className="metric-subtext">{latestBooking.quantity} {latestBooking.unit} • {latestBooking.date}</div>
          </div>

          <div className="metric-card blue-theme">
            <div className="metric-header">
              <span className="metric-label">{t('centreToken') || 'Your Token'}</span>
              <div className="metric-icon-box blue">
                <Users size={18} />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: '20px' }}>
              {latestBooking.centreToken || generateCentreToken(latestBooking.centreId || 'apmc-main', latestBooking.tokenNumber || 1)}
            </div>
            <div className="metric-subtext">{latestBooking.timeSlot || 'Session Slot'}</div>
          </div>

          <div className={`metric-card ${latestBooking.paymentStatus === 'Paid' ? 'green-theme' : 'amber-theme'}`}>
            <div className="metric-header">
              <span className="metric-label">{t('payment') || 'DBT Payment'}</span>
              <div className={`metric-icon-box ${latestBooking.paymentStatus === 'Paid' ? 'green' : 'amber'}`}>
                <CreditCard size={18} />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: '20px' }}>
              {latestBooking.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}
            </div>
            <div className="metric-subtext">
              {latestBooking.totalAmount ? `₹${Number(latestBooking.totalAmount).toLocaleString('en-IN')}` : (latestBooking.paymentMode === 'Cash' ? 'Cash at Counter' : 'Online DBT')}
            </div>
          </div>
        </div>
      )}

      {/* Latest Crop Selling Slot Card (Multi-Color Highlight) */}
      {latestBooking ? (
        <div className="card" style={{ borderTop: '4px solid var(--color-blue)', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', color: '#0F172A', margin: 0, fontWeight: '800' }}>
              🌾 {t('activeSellingSlot')}
            </h2>
            <span className={getStatusBadgeClass(latestBooking.status)}>
              {t('status' + latestBooking.status.replace(/\s+/g, '')) || latestBooking.status}
            </span>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '14px', marginBottom: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="kv-row">
              <span className="kv-label">{t('sellingId')}:</span>
              <span className="kv-value" style={{ color: 'var(--color-green-dark)', fontWeight: '800' }}>
                {latestBooking.sellingId}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('centreToken') || 'Centre Token'}:</span>
              <span className="kv-value" style={{ color: 'var(--color-blue)', fontWeight: '800', fontSize: '15px' }}>
                {latestBooking.centreToken || generateCentreToken(latestBooking.centreId || 'apmc-main', latestBooking.tokenNumber || 1)}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('procurementCentre')}:</span>
              <span className="kv-value" style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                {latestBooking.centre || 'APMC Mandi Main Yard'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('farmerIdCard') || 'Farmer ID'}:</span>
              <span className="kv-value" style={{ fontWeight: '700' }}>
                {latestBooking.farmerIdCard || farmerProfile.farmerIdCard || '10020030040'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('crop')}:</span>
              <span className="kv-value">{latestBooking.crop}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('quantity')}:</span>
              <span className="kv-value">{latestBooking.quantity} {latestBooking.unit}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('date')}:</span>
              <span className="kv-value">{latestBooking.date}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('time')}:</span>
              <span className="kv-value">{latestBooking.timeSlot}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('status')}:</span>
              <span className="kv-value">{t('status' + latestBooking.status.replace(/\s+/g, '')) || latestBooking.status}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('payment')}:</span>
              <span className="kv-value">
                <span className={getPaymentBadgeClass(latestBooking.paymentStatus)}>
                  {t('payment' + latestBooking.paymentStatus) || latestBooking.paymentStatus}
                </span>
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">{t('paymentMode') || 'Payment Mode'}:</span>
              <span className="kv-value" style={{ fontWeight: '700', color: latestBooking.paymentMode === 'Cash' ? 'var(--color-amber-dark)' : 'var(--color-blue)' }}>
                {latestBooking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online DBT')}
              </span>
            </div>
          </div>

          {/* Real-time Mandi Queue Status Box (BLUE THEME) */}
          {(() => {
            const centreLoad = calculateCentreLoad(latestBooking.centreId || latestBooking.centre, latestBooking.date, bookings);
            const liveServing = getLiveServingToken(latestBooking.centreId, latestBooking.date, latestBooking.sessionId);
            const servingToken = generateCentreToken(latestBooking.centreId || 'apmc-main', liveServing);
            const userToken = latestBooking.centreToken || generateCentreToken(latestBooking.centreId || 'apmc-main', latestBooking.tokenNumber || 1);

            return (
              <div className="card-blue" style={{
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-booked" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      {t('liveQueueBadge') || 'LIVE QUEUE STATUS'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-blue-dark)' }}>
                      {userToken}
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: centreLoad.loadBadgeColor,
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    ● {centreLoad.loadStatus}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-blue-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-blue-dark)', fontWeight: '600' }}>{t('currentlyServing') || 'Now Serving'}</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-blue)' }}>
                      {servingToken}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-green-bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-green-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-green-dark)', fontWeight: '600' }}>{t('yourTokenNumber') || 'Your Token'}</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-green)' }}>
                      {userToken}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                  {t('membersAheadLabel') || 'Members Ahead'}: <strong style={{ color: 'var(--color-blue-dark)' }}>{latestBooking.membersAhead || Math.max(0, (latestBooking.tokenNumber || 1) - liveServing)}</strong> (~{latestBooking.estimatedWaitMinutes || 15} mins)
                </div>
                {latestBooking.estimatedTurnTime && (
                  <div style={{ fontSize: '13px', color: 'var(--color-blue-dark)', fontWeight: '600', marginBottom: '4px' }}>
                    {t('expectedTurnLabel') || 'Estimated Turn'}: <strong>{latestBooking.estimatedTurnTime}</strong>
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--color-amber-dark)', backgroundColor: 'var(--color-amber-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-amber-border)', fontWeight: 'bold', marginTop: '6px' }}>
                  🕒 {t('recommendedArrival') || 'Recommended Gate Arrival'}: {latestBooking.recommendedArrivalTime || latestBooking.reportGateTime}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-blue btn-small"
                    style={{ flex: 1, fontWeight: 'bold' }}
                    onClick={() => setSelectedQueueBooking(latestBooking)}
                  >
                    <Users size={15} />
                    {t('viewLiveQueueBtn') || 'View Full Session Queue'}
                  </button>
                  {latestBooking.status !== 'Sale Completed' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      style={{ fontWeight: 'bold' }}
                      onClick={() => setMissedSlotBooking(latestBooking)}
                      title="Rebook slot if you missed your turn"
                    >
                      <RefreshCw size={14} />
                      {t('missedSlot') || 'Missed Slot?'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Action buttons for current booking */}
          <div style={{ display: 'grid', gridTemplateColumns: latestBooking.paymentStatus === 'Paid' ? '1fr 1fr' : '1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline-primary btn-small"
              onClick={() => setSelectedSlipBooking(latestBooking)}
            >
              <FileText size={16} />
              {t('downloadBookingSlip')}
            </button>
            {latestBooking.paymentStatus === 'Paid' && (
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setSelectedPaymentBooking(latestBooking)}
              >
                <CheckCircle size={16} />
                {t('viewPaymentSlip')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            {t('noActiveBookings')}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('sell')}>
            {t('bookCropSlotBtn')}
          </button>
        </div>
      )}

      {/* Quick Navigation Cards (Multi-Color) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div
          className="card card-blue"
          style={{ cursor: 'pointer', margin: 0, padding: '16px', transition: 'all 0.2s ease' }}
          onClick={() => onNavigate('bookings')}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-blue)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Calendar size={22} />
          </div>
          <h3 style={{ fontSize: '16px', color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>{t('myBookings')}</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-blue-dark)', margin: 0, fontWeight: '600' }}>{myBookings.length} {t('all') || 'Bookings'}</p>
        </div>

        <div
          className="card card-amber"
          style={{ cursor: 'pointer', margin: 0, padding: '16px', transition: 'all 0.2s ease' }}
          onClick={() => onNavigate('payment')}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-amber)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <CreditCard size={22} />
          </div>
          <h3 style={{ fontSize: '16px', color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>{t('payment')}</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-amber-dark)', margin: 0, fontWeight: '600' }}>Direct DBT Transfer</p>
        </div>
      </div>

      {/* Guidance Note for Farmers (Multi-Color Informational Theme) */}
      <div className="info-banner-blue" style={{ fontSize: '14px', borderRadius: '10px', padding: '14px 16px' }}>
        <strong style={{ color: 'var(--color-blue-dark)', fontSize: '15px' }}>💡 {t('quickGuidance')}</strong>
        <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
          <li>{t('guideline1')}</li>
          <li>{t('guideline2')}</li>
          <li>{t('guideline3')}</li>
        </ul>
      </div>

      {/* Modals */}
      {selectedSlipBooking && (
        <BookingSlipModal
          booking={selectedSlipBooking}
          onClose={() => setSelectedSlipBooking(null)}
        />
      )}
      {selectedPaymentBooking && (
        <PaymentSlipModal
          booking={selectedPaymentBooking}
          onClose={() => setSelectedPaymentBooking(null)}
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

export default FarmerDashboard;
