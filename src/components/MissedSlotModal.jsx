import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, X, Clock, MapPin, Building2, ChevronRight, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePortalData } from '../context/PortalDataContext';
import { findMissedSlotRecoveryOptions } from '../utils/smartQueueEngine';

export const MissedSlotModal = ({ booking, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { bookings, rescheduleMissedBooking } = usePortalData();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0); // 0 = Option 1, 1 = Option 2
  const [isProcessing, setIsProcessing] = useState(false);

  if (!booking) return null;

  const recovery = findMissedSlotRecoveryOptions(booking, bookings);
  const { option1SameCentre, option2AltCentre } = recovery;

  const handleConfirmRebook = () => {
    setIsProcessing(true);
    const chosen = selectedOptionIndex === 0 ? option1SameCentre : option2AltCentre;
    if (!chosen) {
      setIsProcessing(false);
      return;
    }

    const rebooked = rescheduleMissedBooking(
      booking.sellingId,
      chosen.centreId,
      chosen.date,
      chosen.sessionId
    );

    setIsProcessing(false);
    if (onSuccess) {
      onSuccess(rebooked);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '560px', width: '100%', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: '#FFEBEE',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={22} color="#C62828" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#C62828' }}>
                {t('missedSlotTitle') || 'Missed Slot Recovery'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {t('sellingId')}: <strong>{booking.sellingId}</strong> ({booking.crop} • {booking.quantity} {booking.unit})
              </span>
            </div>
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

        {/* Explain Banner (Orange Theme) */}
        <div className="info-banner-orange" style={{
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          lineHeight: '1.4'
        }}>
          <strong>{t('missedSlot') || 'Missed your turn?'}</strong> {t('missedSlotDesc') || "Don't worry! You can quickly rebook your slot without losing verification. Choose an option below:"}
        </div>

        {/* Option 1: Same Centre */}
        <div
          onClick={() => setSelectedOptionIndex(0)}
          style={{
            border: selectedOptionIndex === 0 ? '2px solid var(--color-red)' : '1px solid var(--color-border)',
            backgroundColor: selectedOptionIndex === 0 ? 'var(--color-red-bg)' : '#FFFFFF',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: selectedOptionIndex === 0 ? '0 2px 8px rgba(220,38,38,0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                id="recovery-opt-1"
                name="recovery-option"
                checked={selectedOptionIndex === 0}
                onChange={() => setSelectedOptionIndex(0)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-red)' }}
              />
              <label htmlFor="recovery-opt-1" style={{ fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: 'var(--color-red-dark)' }}>
                {t('option1SameCentre') || 'Option 1: Next Available at Same Centre'}
              </label>
            </div>
            {selectedOptionIndex === 0 && (
              <span className="badge badge-missed" style={{ fontSize: '11px' }}>Selected</span>
            )}
          </div>

          {option1SameCentre ? (
            <div style={{ marginLeft: '26px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', color: 'var(--color-text-main)', marginTop: '2px' }}>
                🏢 {option1SameCentre.centreName}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                <span>📅 <strong>{option1SameCentre.date}</strong></span>
                <span>⏰ <strong>{option1SameCentre.sessionLabel}</strong></span>
                <span>👥 Queue Ahead: <strong>{option1SameCentre.bookedInSession}</strong></span>
                <span>⏱️ Est. Wait: <strong>{option1SameCentre.estimatedWaitMinutes} mins</strong></span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-red-dark)', fontWeight: 'bold' }}>
                👉 Turn: <strong>{option1SameCentre.turnTime}</strong> (Arrive by: <strong>{option1SameCentre.recommendedArrival}</strong>)
              </div>
            </div>
          ) : (
            <div style={{ marginLeft: '26px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              No remaining sessions available at this centre today. Please select Option 2.
            </div>
          )}
        </div>

        {/* Option 2: Alternative Centre */}
        <div
          onClick={() => setSelectedOptionIndex(1)}
          style={{
            border: selectedOptionIndex === 1 ? '2px solid var(--color-amber)' : '1px solid var(--color-border)',
            backgroundColor: selectedOptionIndex === 1 ? 'var(--color-amber-bg)' : '#FFFFFF',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: selectedOptionIndex === 1 ? '0 2px 8px rgba(217,119,6,0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                id="recovery-opt-2"
                name="recovery-option"
                checked={selectedOptionIndex === 1}
                onChange={() => setSelectedOptionIndex(1)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-amber)' }}
              />
              <label htmlFor="recovery-opt-2" style={{ fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: 'var(--color-amber-dark)' }}>
                {t('option2AltCentre') || 'Option 2: Alternative Centre with Lowest Queue'}
              </label>
            </div>
            {selectedOptionIndex === 1 && (
              <span className="badge badge-pending" style={{ fontSize: '11px' }}>Selected</span>
            )}
          </div>

          {option2AltCentre ? (
            <div style={{ marginLeft: '26px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', color: 'var(--color-text-main)', marginTop: '2px' }}>
                🏢 {option2AltCentre.centreName}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                <span>📅 <strong>{option2AltCentre.date}</strong></span>
                <span>⏰ <strong>{option2AltCentre.sessionLabel}</strong></span>
                <span>👥 Queue Ahead: <strong>{option2AltCentre.bookedInSession}</strong></span>
                <span>⏱️ Est. Wait: <strong>{option2AltCentre.estimatedWaitMinutes} mins</strong></span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-amber-dark)', fontWeight: 'bold' }}>
                👉 Turn: <strong>{option2AltCentre.turnTime}</strong> (Arrive by: <strong>{option2AltCentre.recommendedArrival}</strong>)
              </div>
            </div>
          ) : (
            <div style={{ marginLeft: '26px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              All procurement centres are currently at full capacity for today.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {onClose && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '40%' }}
              onClick={onClose}
              disabled={isProcessing}
            >
              {t('cancel') || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            style={{ width: onClose ? '60%' : '100%', fontSize: '15px' }}
            onClick={handleConfirmRebook}
            disabled={isProcessing || (selectedOptionIndex === 0 && !option1SameCentre) || (selectedOptionIndex === 1 && !option2AltCentre)}
          >
            {isProcessing ? 'Rebooking...' : (t('rebookNow') || 'Rebook Slot Now')} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissedSlotModal;
