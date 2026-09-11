import React, { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, ArrowLeft, ShieldAlert, AlertCircle, X, ChevronRight, Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePortalData } from '../context/PortalDataContext';
import {
  CENTRES_CONFIG,
  SESSIONS_CONFIG,
  getCentreConfig,
  getSessionConfig,
  generateCentreToken,
  calculateEstimatedWaitTime,
  calculateRecommendedArrivalTime,
  calculateCentreLoad,
  DEFAULT_PROCESSING_TIME
} from '../utils/smartQueueEngine';

export const SlotQueueModal = ({
  centreId,
  sessionId,
  date,
  timeSlot,
  centre,
  cropInfo,
  currentBooking,
  onConfirm,
  onBack,
  onClose,
  isModal = false
}) => {
  const { t } = useLanguage();
  const { bookings, farmerProfile } = usePortalData();

  // Resolve centre & session configs
  const centreConfig = getCentreConfig(centreId || centre);
  const sessionConfig = getSessionConfig(sessionId || timeSlot);
  const resolvedDate = date || '10 September 2026';

  // Simulated queue loading animation
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(20);
  const [loadingStepText, setLoadingStepText] = useState('Connecting to Mandi Registration Server...');

  useEffect(() => {
    setLoading(true);
    setLoadingProgress(25);
    setLoadingStepText(`Connecting to ${centreConfig.name} Server...`);

    const timer1 = setTimeout(() => {
      setLoadingProgress(60);
      setLoadingStepText('Fetching registered members for this session...');
    }, 250);

    const timer2 = setTimeout(() => {
      setLoadingProgress(90);
      setLoadingStepText('Calculating 15-min turn times & recommended gate arrival...');
    }, 500);

    const timer3 = setTimeout(() => {
      setLoadingProgress(100);
      setLoading(false);
    }, 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [resolvedDate, centreConfig.id, sessionConfig.id]);

  // Find all existing bookings for this Centre + Date + Session
  const slotBookings = (bookings || [])
    .filter(b => {
      const matchCentre = (b.centreId === centreConfig.id) || (b.centre && b.centre.toLowerCase().includes(centreConfig.name.toLowerCase()));
      const matchDate = b.date === resolvedDate;
      const matchSession = (b.sessionId === sessionConfig.id) || (b.timeSlot && b.timeSlot.includes(sessionConfig.time));
      const notCancelled = b.status !== 'Cancelled' && b.status !== 'Rescheduled';
      return matchCentre && matchDate && matchSession && notCancelled;
    })
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Determine token number and members ahead
  let userTokenIndex = 1;
  let priorMembers = [];

  if (currentBooking) {
    // Viewing an existing confirmed booking
    userTokenIndex = currentBooking.tokenNumber || 1;
    priorMembers = slotBookings.filter(b => (b.tokenNumber || 0) < userTokenIndex);
  } else {
    // New booking flow: next available token
    userTokenIndex = Math.min(8, slotBookings.length + 1);
    priorMembers = [...slotBookings];
  }

  const userCentreToken = currentBooking?.centreToken || generateCentreToken(centreConfig.id, userTokenIndex);
  const estimatedWaitMinutes = calculateEstimatedWaitTime(userTokenIndex, DEFAULT_PROCESSING_TIME);
  const arrivalInfo = calculateRecommendedArrivalTime(sessionConfig.startTime, userTokenIndex, DEFAULT_PROCESSING_TIME, 10);
  const centreLoad = calculateCentreLoad(centreConfig.id, resolvedDate, bookings);
  const membersAheadCount = Math.max(0, userTokenIndex - 1);

  // Format wait time string dynamically
  const formatWaitText = (mins) => {
    if (mins === 0) return '0 Mins (Direct Turn)';
    if (mins < 60) return `${mins} Minutes`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hours} hr ${rem} mins` : `${hours} Hours`;
  };

  return (
    <div className={isModal ? 'modal-backdrop' : ''}>
      <div className={isModal ? 'modal-card' : ''} style={{ maxWidth: isModal ? '540px' : '100%', width: '100%' }}>
        {/* Modal / Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && !isModal && (
              <button
                type="button"
                className="icon-btn"
                onClick={onBack}
                aria-label="Back"
                style={{ padding: '4px' }}
              >
                <ArrowLeft size={22} color="var(--color-primary-dark)" />
              </button>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--color-primary-dark)' }}>
              👥 {t('queueStatusTitle') || 'Slot Queue & Estimated Waiting Time'}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
              style={{ padding: '4px' }}
            >
              <X size={22} color="var(--color-text-muted)" />
            </button>
          )}
        </div>

        {/* Selected Slot Information Header */}
        <div style={{
          backgroundColor: 'var(--color-secondary-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '14px',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>
                🏢 {t('procurementCentre') || 'Procurement Centre'}
              </span>
              <strong style={{ color: 'var(--color-primary-dark)', fontSize: '16px' }}>{centreConfig.name}</strong>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                {centreConfig.address}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                backgroundColor: centreLoad.loadBadgeColor,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '3px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                ● {centreLoad.loadStatus} ({centreLoad.capacityPercentage}% Full)
              </span>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {centreLoad.availableSlots} of 32 daily slots free
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)', fontSize: '13px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block' }}>📅 {t('date') || 'Date'}:</span>
              <strong style={{ color: 'var(--color-primary-dark)' }}>{resolvedDate}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block' }}>⏰ {t('timeSlot') || 'Session'}:</span>
              <strong style={{ color: 'var(--color-primary-dark)' }}>{sessionConfig.time}</strong>
            </div>
            {cropInfo && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block' }}>🌾 {t('crop') || 'Crop'}:</span>
                <strong>{cropInfo.crop} ({cropInfo.quantity} {cropInfo.unit})</strong>
              </div>
            )}
            {cropInfo?.paymentMode && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block' }}>💳 {t('paymentMode') || 'Payout'}:</span>
                <strong style={{ color: cropInfo.paymentMode === 'Cash' ? '#D84315' : 'var(--color-primary-dark)' }}>
                  {cropInfo.paymentMode === 'Cash' ? '💵 Cash at Counter' : '🏦 Online DBT'}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            LOADING QUEUE STATE
        ================================================== */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 16px', margin: '14px 0' }}>
            <div style={{
              width: '44px',
              height: '44px',
              border: '4px solid var(--color-border)',
              borderTop: '4px solid var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }} />
            <h3 style={{ fontSize: '17px', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              {t('loadingQueueTitle') || 'Loading Live Queue...'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              {loadingStepText}
            </p>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              maxWidth: '280px',
              height: '8px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '4px',
              margin: '0 auto 12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.25s ease'
              }} />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setLoading(false)}
              style={{ fontSize: '12px', marginTop: '6px' }}
            >
              Skip Loading →
            </button>
          </div>
        ) : (
          /* ==================================================
              LOADED QUEUE CONTENT & ESTIMATED WAITING TIME
          ================================================== */
          <div>
            {/* Top 3 Metric Summary Boxes (Multi-Color Theme) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '14px'
            }}>
              {/* Box 1: Members Ahead (Blue Theme) */}
              <div style={{
                backgroundColor: 'var(--color-blue-bg)',
                border: '1.5px solid var(--color-blue-border)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-blue-dark)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {t('queueAhead') || 'Queue Ahead'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-blue)', marginTop: '4px' }}>
                  {membersAheadCount}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {membersAheadCount} {t('farmersAhead') || 'farmers ahead'}
                </div>
              </div>

              {/* Box 2: Your Centre Token (Blue/Green Highlight) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid var(--color-blue)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.15)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-blue)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {t('centreToken') || 'Centre Token'}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-blue)', marginTop: '4px' }}>
                  {userCentreToken}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {t('slotOf8') || 'Slot'} #{userTokenIndex} / 8
                </div>
              </div>

              {/* Box 3: Estimated Wait Time (Amber/Purple Accent) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {t('estimatedWait') || 'Est. Wait Time'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text-main)', marginTop: '4px' }}>
                  {formatWaitText(estimatedWaitMinutes)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {t('perFarmerTurn') || '15 min / farmer turn'}
                </div>
              </div>
            </div>

            {/* Prominent Estimated Turn & Gate Arrival Time Card (BLUE THEME) */}
            <div className="card-blue" style={{
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Clock size={20} color="var(--color-blue)" />
                <strong style={{ fontSize: '15px', color: 'var(--color-blue-dark)' }}>
                  {t('recommendedArrival') || 'Session Schedule & Recommended Arrival'}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-blue-border)', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-blue-dark)', fontWeight: '600' }}>
                    {t('expectedTurnLabel') || 'Estimated Turn Time'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-blue)', marginTop: '2px' }}>
                    {arrivalInfo.turnTime}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-green-dark)', fontWeight: 'bold' }}>
                    {t('recommendedArrival') || 'Recommended Arrival'} ({t('tenMinPrior') || '10m prior'})
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-green)', marginTop: '2px' }}>
                    {arrivalInfo.recommendedArrival}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-main)', lineHeight: '1.4' }}>
                ℹ️ {t('standardProcessing') || `Standard processing: 15 minutes per farmer. Please arrive by ${arrivalInfo.recommendedArrival} to complete physical weighment verification without delay.`}
              </div>
            </div>

            {/* 5-Minute Reminder Alert (ORANGE THEME) */}
            <div className="info-banner-orange" style={{
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ fontSize: '20px' }}>🔔</div>
              <div>
                <strong style={{ color: 'var(--color-amber-dark)' }}>{t('smartReminderTitle') || '5-Minute Smart Reminder'}:</strong>
                <div style={{ fontSize: '12px', color: 'var(--color-amber-dark)', marginTop: '2px' }}>
                  {t('smartReminderText') || `You will receive an automated gate call alert 5 minutes before token ${userCentreToken} begins physical weighment.`}
                </div>
              </div>
            </div>

            {/* List of Members Registered Before Him for the SAME Centre & Session */}
            <div style={{
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '8px',
                marginBottom: '10px'
              }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>
                  👥 {t('priorMembersTitle') || 'Members Registered Ahead in this Session'} ({priorMembers.length})
                </strong>
                <span className="badge badge-paid">
                  {centreConfig.shortCode} • {sessionConfig.time}
                </span>
              </div>

              {priorMembers.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-secondary-bg)',
                  borderRadius: '6px',
                  color: 'var(--color-primary-dark)',
                  fontSize: '14px'
                }}>
                  🌟 <strong>{t('noPriorMembersMsg') || 'You are the FIRST farmer in this session! Zero waiting time.'}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {priorMembers.map((member, idx) => {
                    const memberTokenNum = member.tokenNumber || (idx + 1);
                    const memberToken = member.centreToken || generateCentreToken(centreConfig.id, memberTokenNum);
                    const memberArrival = calculateRecommendedArrivalTime(sessionConfig.startTime, memberTokenNum, DEFAULT_PROCESSING_TIME, 10);
                    return (
                      <div
                        key={member.id || member.sellingId || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          backgroundColor: idx === 0 ? '#F9FBE7' : '#FFFFFF',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: 'var(--color-primary-dark)',
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '12px',
                            minWidth: '60px',
                            textAlign: 'center'
                          }}>
                            {memberToken}
                          </span>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--color-text-main)' }}>
                              {member.farmerName}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {member.sellingId} • {member.crop} ({member.quantity} {member.unit || 'kg'})
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'block' }}>
                            {memberArrival.turnTime}
                          </span>
                          <span className={`badge ${member.status === 'Sale Completed' ? 'badge-paid' : member.status === 'Weighed' ? 'badge-verified' : 'badge-booked'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                            {member.status || 'In Queue'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Farmer's Own Spot Highlighted (Green & Blue Theme) */}
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#F0FDF4',
                border: '2px solid var(--color-green)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 6px rgba(21,128,61,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    backgroundColor: 'var(--color-blue)',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '13px',
                    minWidth: '65px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                  }}>
                    {userCentreToken}
                  </span>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-green-dark)', fontSize: '14px' }}>
                      👉 {t('yourTurnTitle') || 'Your Spot'}: {currentBooking ? currentBooking.farmerName : (farmerProfile.fullName || 'You')}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {cropInfo ? `${cropInfo.crop} (${cropInfo.quantity} ${cropInfo.unit})` : 'Your Crop Booking'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--color-green-dark)', fontSize: '15px', display: 'block' }}>
                    {arrivalInfo.turnTime}
                  </strong>
                  <span className="badge badge-completed" style={{ fontSize: '11px' }}>
                    {currentBooking ? 'Confirmed' : 'Next in Line'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {onConfirm && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                {onBack && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '40%' }}
                    onClick={onBack}
                  >
                    ← {t('selectDifferentSlot') || 'Change Slot'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: onBack ? '60%' : '100%', fontSize: '15px' }}
                  onClick={onConfirm}
                >
                  {t('confirmAndBook') || 'Confirm Booking & Get Selling ID'} →
                </button>
              </div>
            )}

            {isModal && onClose && !onConfirm && (
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={onClose}
                >
                  Close Queue Window
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotQueueModal;
