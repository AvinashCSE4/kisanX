import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Download,
  Sprout,
  Sparkles,
  ChevronRight,
  Building2,
  AlertCircle,
  Layers
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import VoiceInput from '../../components/VoiceInput';
import BookingSlipModal from '../../components/BookingSlipModal';
import CalendarPicker from '../../components/CalendarPicker';
import SlotQueueModal from '../../components/SlotQueueModal';
import {
  CENTRES_CONFIG,
  SESSIONS_CONFIG,
  getCentreConfig,
  getSessionConfig,
  calculateCentreLoad,
  calculateSessionQueue,
  getSmartSlotRecommendation,
  generateCentreToken,
  DEFAULT_PROCESSING_TIME
} from '../../utils/smartQueueEngine';

export const BookSlotFlow = ({ onBookingComplete, onNavigateToDashboard }) => {
  const { t } = useLanguage();
  const { createBooking, bookings, getLiveServingToken, farmerProfile } = usePortalData();

  // Steps:
  // 1: Crop + Quantity + Payment Collection Mode + Preferred Date
  // 2: Smart Slot Recommendation & Multi-Centre Comparison
  // 3: Live Queue Loading & Waiting Time Modal/View
  // 4: Confirmed Selling ID + Centre Token Receipt
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [crop, setCrop] = useState('Wheat');
  const [variety, setVariety] = useState('Sharbati');
  const [quantity, setQuantity] = useState('500');
  const [unit, setUnit] = useState('kg');
  const [paymentMode, setPaymentMode] = useState(farmerProfile?.preferredPaymentMode || 'Online'); // 'Online' | 'Cash'
  const [date, setDate] = useState('10 September 2026');

  // Step 2 selections (Centre + Session)
  const [selectedCentreId, setSelectedCentreId] = useState('apmc-main');
  const [selectedSessionId, setSelectedSessionId] = useState('session-1');

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Get Smart Recommendation based on selected Date
  const recommendation = getSmartSlotRecommendation(date, selectedCentreId, bookings);
  const recommendedOption = recommendation.recommendedOption;

  // Handle Step 1 -> Step 2
  const handleContinueToRecommendation = (e) => {
    e.preventDefault();
    if (!crop || !quantity || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid quantity to sell');
      return;
    }
    setErrorMsg('');

    // Pre-select recommended centre & session if available
    if (recommendedOption) {
      setSelectedCentreId(recommendedOption.centreId);
      setSelectedSessionId(recommendedOption.sessionId);
    }
    setCurrentStep(2);
  };

  // Handle Step 2 -> Step 3
  const handleProceedToQueue = (chosenCentreId, chosenSessionId) => {
    const cId = chosenCentreId || selectedCentreId;
    const sId = chosenSessionId || selectedSessionId;

    if (!cId || !sId) {
      setErrorMsg('Please select a procurement centre and session');
      return;
    }

    // Verify session is not full
    const sessionQ = calculateSessionQueue(cId, date, sId, bookings);
    if (sessionQ.isFull) {
      setErrorMsg('Selected session is completely full (8/8 capacity). Please choose another session or centre.');
      return;
    }

    setSelectedCentreId(cId);
    setSelectedSessionId(sId);
    setErrorMsg('');
    setCurrentStep(3);
  };

  // Handle Step 3 -> Step 4 (Final Booking Creation)
  const handleFinalConfirmBooking = () => {
    setErrorMsg('');

    const centreConfig = getCentreConfig(selectedCentreId);
    const sessionConfig = getSessionConfig(selectedSessionId);

    const newBooking = createBooking({
      crop,
      variety,
      quantity,
      unit,
      centreId: centreConfig.id,
      centre: centreConfig.name,
      date,
      sessionId: sessionConfig.id,
      timeSlot: sessionConfig.time,
      paymentMode
    });

    setConfirmedBooking(newBooking);
    setCurrentStep(4);
    if (onBookingComplete) {
      onBookingComplete(newBooking);
    }
  };

  return (
    <div className="main-content">
      {/* ==================================================
          STEP 1: CROP DETAILS, PAYMENT MODE & PREFERRED DATE
      ================================================== */}
      {currentStep === 1 && (
        <div>
          <h1 className="page-title">{t('cropDetailsTitle')}</h1>
          <p className="subtitle">{t('cropDetailsSubtitle')}</p>

          <form onSubmit={handleContinueToRecommendation} className="card">
            {/* Crop Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="cropSelect">
                {t('cropName')}
              </label>
              <div className="input-with-mic">
                <select
                  id="cropSelect"
                  className="form-select"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                >
                  <option value="Wheat">{t('cropWheat')}</option>
                  <option value="Rice">{t('cropRice')}</option>
                  <option value="Cotton">{t('cropCotton')}</option>
                  <option value="Maize">{t('cropMaize')}</option>
                  <option value="Groundnut">{t('cropGroundnut')}</option>
                  <option value="Bajra">{t('cropBajra')}</option>
                  <option value="Mustard">{t('cropMustard')}</option>
                  <option value="Other">{t('cropOther')}</option>
                </select>
                <VoiceInput
                  fieldName={t('cropName')}
                  onResult={(spoken) => {
                    const clean = spoken.toLowerCase();
                    if (clean.includes('wheat') || clean.includes('गेहूं') || clean.includes('ઘઉં')) setCrop('Wheat');
                    else if (clean.includes('rice') || clean.includes('धान') || clean.includes('ચોખા')) setCrop('Rice');
                    else if (clean.includes('cotton') || clean.includes('कपास') || clean.includes('કપાસ')) setCrop('Cotton');
                    else if (clean.includes('maize') || clean.includes('मक्का') || clean.includes('મકાઈ')) setCrop('Maize');
                    else if (clean.includes('groundnut') || clean.includes('मूंगफली') || clean.includes('મગફળી')) setCrop('Groundnut');
                    else if (clean.includes('bajra') || clean.includes('बाजरा') || clean.includes('બાજરી')) setCrop('Bajra');
                    else if (clean.includes('mustard') || clean.includes('सरसों') || clean.includes('રાયડો')) setCrop('Mustard');
                    else setCrop('Other');
                  }}
                />
              </div>
            </div>

            {/* Variety */}
            <div className="form-group">
              <label className="form-label" htmlFor="varietyInput">
                {t('cropVariety')}
              </label>
              <div className="input-with-mic">
                <input
                  id="varietyInput"
                  type="text"
                  className="form-input"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder={t('cropVarietyPlaceholder')}
                />
                <VoiceInput
                  fieldName={t('cropVariety')}
                  onResult={(text) => setVariety(text)}
                />
              </div>
            </div>

            {/* Quantity and Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="quantityInput">
                  {t('quantityToSell')}
                </label>
                <div className="input-with-mic">
                  <input
                    id="quantityInput"
                    type="number"
                    min="1"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    required
                  />
                  <VoiceInput
                    fieldName={t('quantityToSell')}
                    onResult={(text) => {
                      const num = text.replace(/\D/g, '');
                      if (num) setQuantity(num);
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unitSelect">
                  {t('unit')}
                </label>
                <select
                  id="unitSelect"
                  className="form-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="kg">{t('kg')}</option>
                  <option value="quintal">{t('quintal')}</option>
                </select>
              </div>
            </div>

            {/* Preferred Date Selection */}
            <div className="form-group" style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
              <label className="form-label">
                📅 {t('selectDate')} (Preferred Date)
              </label>
              <CalendarPicker
                selectedDateStr={date}
                onSelectDate={(newDate) => setDate(newDate)}
              />
            </div>

            {/* Mode of Payment to Collect Cash / Online */}
            <div className="form-group" style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
              <label className="form-label" style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A' }}>
                💳 {t('paymentMode') || 'Payment Collection Mode'} *
              </label>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '-4px', marginBottom: '12px' }}>
                {t('paymentModeSubtitle') || 'Select how you would like to collect your crop sale payout'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {/* Online Bank Transfer / DBT (Blue Theme) */}
                <div
                  onClick={() => setPaymentMode('Online')}
                  style={{
                    border: paymentMode === 'Online' ? '2.5px solid var(--color-blue)' : '1.5px solid var(--color-border)',
                    backgroundColor: paymentMode === 'Online' ? 'var(--color-blue-bg)' : '#FFFFFF',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: paymentMode === 'Online' ? '0 2px 8px rgba(37,99,235,0.18)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-blue-dark)' }}>
                      🏦 {t('paymentModeOnline') || 'Online (DBT)'}
                    </span>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="Online"
                      checked={paymentMode === 'Online'}
                      onChange={() => setPaymentMode('Online')}
                      style={{ accentColor: 'var(--color-blue)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.3' }}>
                    {t('paymentModeOnlineDesc') || 'Direct bank transfer into registered account'}
                  </p>
                </div>

                {/* Cash at Mandi Counter (Amber Theme) */}
                <div
                  onClick={() => setPaymentMode('Cash')}
                  style={{
                    border: paymentMode === 'Cash' ? '2.5px solid var(--color-amber)' : '1.5px solid var(--color-border)',
                    backgroundColor: paymentMode === 'Cash' ? 'var(--color-amber-bg)' : '#FFFFFF',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: paymentMode === 'Cash' ? '0 2px 8px rgba(217,119,6,0.18)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-amber-dark)' }}>
                      💵 {t('paymentModeCash') || 'Cash at Counter'}
                    </span>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="Cash"
                      checked={paymentMode === 'Cash'}
                      onChange={() => setPaymentMode('Cash')}
                      style={{ accentColor: 'var(--color-amber)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.3' }}>
                    {t('paymentModeCashDesc') || 'Collect physical cash payout directly at Mandi counter'}
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="info-banner-warning info-banner" style={{ marginTop: '14px' }}>{errorMsg}</div>
            )}

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-gradient" style={{ width: '100%', fontSize: '16px', fontWeight: '800' }}>
                {t('continue') || 'Continue to Smart Slot Recommendation'} →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================
          STEP 2: SMART RECOMMENDATION & CENTRE COMPARISON
      ================================================== */}
      {currentStep === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--color-primary-dark)', padding: '4px' }}
              onClick={() => setCurrentStep(1)}
              aria-label={t('back')}
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="page-title" style={{ margin: 0 }}>
              🎯 {t('smartRecommendationTitle') || 'Smart Slot Recommendation'}
            </h1>
          </div>
          <p className="subtitle">
            System analysis across all 4 procurement centres for <strong>{date}</strong>
          </p>

          {/* Selected Crop Pill Summary */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>🌾 {t('crop')}</span>
              <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                {crop} ({variety}) • {quantity} {unit}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>📅 {t('date')}</span>
              <strong style={{ fontSize: '15px', color: '#0F172A' }}>{date}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>💳 {t('paymentMode') || 'Payout'}</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: paymentMode === 'Cash' ? '#FEF3C7' : '#EFF6FF',
                color: paymentMode === 'Cash' ? '#92400E' : '#1D4ED8',
                border: paymentMode === 'Cash' ? '1px solid #FCD34D' : '1px solid #BFDBFE'
              }}>
                {paymentMode === 'Cash' ? '💵 Cash at Counter' : '🏦 Direct Online DBT'}
              </span>
            </div>
          </div>

          {/* ==================================================
              FEATURED RECOMMENDATION CARD (PURPLE AI THEME)
          ================================================== */}
          {recommendedOption ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid var(--color-purple)',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '22px',
              boxShadow: '0 6px 20px rgba(124, 58, 237, 0.12)',
              position: 'relative',
              background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)'
            }}>
              {/* Purple AI Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-purple)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '20px',
                marginBottom: '12px',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)'
              }}>
                <Sparkles size={14} />
                ✨ {t('recommendedBadge') || 'SMART AI RECOMMENDATION'}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', color: 'var(--color-purple-dark)' }}>
                    🏢 {recommendedOption.centreName}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '3px', color: 'var(--color-purple)' }} />
                    {recommendedOption.address}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: recommendedOption.loadBadgeColor,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    ● {recommendedOption.loadStatus}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {recommendedOption.centreLoad.availableSlots} of 32 daily slots free
                  </div>
                </div>
              </div>

              {/* Recommendation Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                margin: '14px 0',
                padding: '12px',
                backgroundColor: 'var(--color-purple-bg)',
                border: '1px solid var(--color-purple-border)',
                borderRadius: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#6B21A8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    ⏰ Best Session
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-purple-dark)' }}>
                    {recommendedOption.sessionLabel}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#6B21A8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    👥 Queue Ahead
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-blue)' }}>
                    {recommendedOption.bookedInSession} farmers
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#6B21A8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    ⏱️ Est. Wait Time
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: recommendedOption.estimatedWaitMinutes === 0 ? 'var(--color-primary)' : 'var(--color-amber)' }}>
                    ~{recommendedOption.estimatedWaitMinutes} mins
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#6B21A8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    🕒 Recommended Arrival
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-primary)' }}>
                    {recommendedOption.recommendedArrival}
                  </div>
                </div>
              </div>

              {/* Why this is recommended (Transparent explanation) */}
              <div style={{
                fontSize: '13px',
                color: '#5B21B6',
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                padding: '10px 12px',
                borderRadius: '6px',
                lineHeight: '1.4',
                marginBottom: '14px'
              }}>
                <strong>✨ {t('whyRecommended') || 'Why this is recommended'}:</strong> {recommendedOption.reasoning}
              </div>

              {/* Instant Choose Button */}
              <button
                type="button"
                className="btn btn-purple"
                style={{ width: '100%', fontSize: '15px', padding: '12px' }}
                onClick={() => handleProceedToQueue(recommendedOption.centreId, recommendedOption.sessionId)}
              >
                Choose Recommended Slot ({recommendedOption.centreShortCode} • {recommendedOption.sessionTime}) →
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-danger)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px' }} />
              <p>All sessions across all centres are currently at full capacity for {date}. Please select another date.</p>
            </div>
          )}

          {/* ==================================================
              ALTERNATIVE CENTRES & SESSIONS COMPARISON
          ================================================== */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                🏢 {t('compareCentres') || 'Compare All 4 Procurement Centres & Sessions'}
              </h2>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                {date}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CENTRES_CONFIG.map((centreConfig) => {
                const centreLoad = calculateCentreLoad(centreConfig.id, date, bookings);
                const isRecommendedCentre = recommendedOption?.centreId === centreConfig.id;

                return (
                  <div
                    key={centreConfig.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: isRecommendedCentre ? '2px solid #7C3AED' : '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: isRecommendedCentre ? '0 4px 16px rgba(124, 58, 237, 0.08)' : '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Centre Header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '16px', color: '#0F172A' }}>
                            {centreConfig.name}
                          </strong>
                          <span style={{
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Prefix: {centreConfig.prefix}
                          </span>
                          {isRecommendedCentre && (
                            <span style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: '800',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #FCD34D'
                            }}>
                              ⭐ AI Recommended
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px', color: '#64748B' }} />
                          {centreConfig.address}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          backgroundColor: centreLoad.loadBadgeColor,
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '3px 10px',
                          borderRadius: '12px'
                        }}>
                          ● {centreLoad.loadStatus}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          {centreLoad.bookedFarmers}/32 booked ({centreLoad.availableSlots} free)
                        </div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#EEEEEE',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: `${centreLoad.capacityPercentage}%`,
                        height: '100%',
                        backgroundColor: centreLoad.loadBadgeColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* 4 Sessions Grid for this Centre */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {SESSIONS_CONFIG.map((sessionConfig) => {
                        const sessionQ = calculateSessionQueue(centreConfig.id, date, sessionConfig.id, bookings);
                        const isSelected = selectedCentreId === centreConfig.id && selectedSessionId === sessionConfig.id;
                        const isRecommendedSession = isRecommendedCentre && recommendedOption?.sessionId === sessionConfig.id;

                        return (
                          <button
                            key={sessionConfig.id}
                            type="button"
                            disabled={sessionQ.isFull}
                            onClick={() => {
                              setSelectedCentreId(centreConfig.id);
                              setSelectedSessionId(sessionConfig.id);
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: isSelected
                                ? '2px solid #2563EB'
                                : isRecommendedSession
                                ? '1.5px solid #7C3AED'
                                : '1px solid var(--color-border)',
                              backgroundColor: sessionQ.isFull
                                ? '#F8FAFC'
                                : isSelected
                                ? '#EFF6FF'
                                : isRecommendedSession
                                ? '#FAF5FF'
                                : '#FFFFFF',
                              cursor: sessionQ.isFull ? 'not-allowed' : 'pointer',
                              opacity: sessionQ.isFull ? 0.6 : 1,
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '13px', color: sessionQ.isFull ? '#94A3B8' : isSelected ? '#1E40AF' : '#0F172A' }}>
                                {sessionConfig.time}
                              </strong>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: sessionQ.isFull ? '#FEE2E2' : isSelected ? '#2563EB' : '#E2E8F0',
                                color: sessionQ.isFull ? '#DC2626' : isSelected ? '#FFFFFF' : '#334155'
                              }}>
                                {sessionQ.isFull ? t('sessionFull') || 'FULL' : `${sessionQ.availableSlots} left`}
                              </span>
                            </div>

                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Ahead: <strong>{sessionQ.bookedCount}</strong></span>
                              <span>Wait: <strong>~{sessionQ.estimatedWaitMinutes}m</strong></span>
                              <span>Arrive: <strong>{sessionQ.recommendedArrival}</strong></span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="info-banner-warning info-banner" style={{ marginBottom: '14px' }}>{errorMsg}</div>
          )}

          {/* Bottom Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '35%' }}
              onClick={() => setCurrentStep(1)}
            >
              {t('back')}
            </button>
            <button
              type="button"
              className="btn btn-gradient"
              style={{ width: '65%', fontSize: '15px' }}
              onClick={() => handleProceedToQueue(selectedCentreId, selectedSessionId)}
            >
              👥 {t('viewSlotQueue') || 'View Live Queue & Confirm'} →
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          STEP 3: LIVE QUEUE LOADING & WAITING TIME
      ================================================== */}
      {currentStep === 3 && (
        <SlotQueueModal
          centreId={selectedCentreId}
          sessionId={selectedSessionId}
          date={date}
          cropInfo={{ crop, variety, quantity, unit, paymentMode }}
          onBack={() => setCurrentStep(2)}
          onConfirm={handleFinalConfirmBooking}
          isModal={false}
        />
      )}

      {/* ==================================================
          STEP 4: UNIQUE SELLING ID & CENTRE TOKEN CONFIRMATION
      ================================================== */}
      {currentStep === 4 && confirmedBooking && (
        <div>
          {/* Confirmed Header */}
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px', borderTop: '4px solid #2563EB', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            <div style={{
              display: 'inline-flex',
              padding: '14px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)',
              borderRadius: '50%',
              color: '#2563EB',
              marginBottom: '12px',
              border: '2px solid #BFDBFE'
            }}>
              <CheckCircle size={40} color="#2563EB" />
            </div>
            <h1 style={{ fontSize: '24px', color: '#0F172A', fontWeight: '800', marginBottom: '6px' }}>
              {t('bookingConfirmedTitle')}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-main)', marginBottom: '16px' }}>
              {t('bookingSuccessMsg')}
            </p>

            {/* Selling ID & Centre Token Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '18px 0' }}>
              {/* Selling ID */}
              <div style={{ backgroundColor: '#EFF6FF', border: '2px dashed #2563EB', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  {t('sellingId')}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E40AF', letterSpacing: '1px', marginTop: '4px' }}>
                  {confirmedBooking.sellingId}
                </div>
              </div>

              {/* Centre Token */}
              <div style={{ backgroundColor: '#FAF5FF', border: '2px solid #7C3AED', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6D28D9', textTransform: 'uppercase', fontWeight: '800' }}>
                  {t('centreToken') || 'Centre Token'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#6D28D9', letterSpacing: '1px', marginTop: '4px' }}>
                  {confirmedBooking.centreToken || confirmedBooking.tokenNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#7C3AED', marginTop: '2px', fontWeight: '600' }}>
                  Slot #{confirmedBooking.tokenNumber} of 8 in session
                </div>
              </div>
            </div>

            {/* Real-time Queue Tracking Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '16px', margin: '16px 0', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                  📡 {confirmedBooking.centre} • QUEUE STATUS
                </span>
                <span className="badge badge-paid">Live Queue</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: '#1E40AF', fontWeight: '600' }}>Now Serving Token</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#1D4ED8' }}>
                    {generateCentreToken(confirmedBooking.centreId || 'apmc-main', getLiveServingToken(confirmedBooking.centreId, confirmedBooking.date, confirmedBooking.sessionId))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: '#6D28D9', fontWeight: '700' }}>Your Token</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#6D28D9' }}>
                    {confirmedBooking.centreToken}
                  </div>
                </div>
              </div>

              <div className="kv-row">
                <span className="kv-label">Members Ahead of You:</span>
                <span className="kv-value">
                  {confirmedBooking.membersAhead} farmers (~{confirmedBooking.estimatedWaitMinutes} mins)
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Estimated Turn Time:</span>
                <span className="kv-value" style={{ color: '#1E40AF', fontSize: '16px', fontWeight: '700' }}>
                  {confirmedBooking.estimatedTurnTime}
                </span>
              </div>
              <div className="kv-row" style={{ borderBottom: 'none' }}>
                <span className="kv-label" style={{ color: '#0F172A', fontWeight: 'bold' }}>Recommended Gate Arrival:</span>
                <span className="kv-value" style={{ color: '#D97706', fontWeight: 'bold', fontSize: '16px' }}>
                  {confirmedBooking.recommendedArrivalTime || confirmedBooking.reportGateTime}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="info-banner info-banner-orange" style={{ fontSize: '13.5px', textAlign: 'left', margin: '16px 0' }}>
              <strong>⚠️ {t('quickGuidance')}:</strong> Please show Selling ID <strong>{confirmedBooking.sellingId}</strong> and Token <strong>{confirmedBooking.centreToken}</strong> at the gate. Please arrive by <strong>{confirmedBooking.recommendedArrivalTime || confirmedBooking.reportGateTime}</strong>.
            </div>

            {/* Live Queue Button */}
            <button
              type="button"
              className="btn btn-outline-blue"
              style={{ width: '100%', marginBottom: '14px', fontWeight: 'bold', padding: '12px' }}
              onClick={() => setShowQueueModal(true)}
            >
              👥 {t('viewLiveQueueBtn') || 'View Full Session Queue & Member List'}
            </button>

            {/* Details Table */}
            <div style={{ textAlign: 'left', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '14px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
              <div className="kv-row">
                <span className="kv-label">{t('farmer')}:</span>
                <span className="kv-value">{confirmedBooking.farmerName}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('crop')}:</span>
                <span className="kv-value">{confirmedBooking.crop} ({confirmedBooking.variety})</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('quantity')}:</span>
                <span className="kv-value">{confirmedBooking.quantity} {confirmedBooking.unit}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('procurementCentre')}:</span>
                <span className="kv-value">{confirmedBooking.centre}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('date')}:</span>
                <span className="kv-value">{confirmedBooking.date}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('timeSlot')}:</span>
                <span className="kv-value" style={{ color: '#1E40AF', fontWeight: 'bold' }}>
                  {confirmedBooking.timeSlot} ({confirmedBooking.centreToken})
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t('paymentMode') || 'Payment Collection Mode'}:</span>
                <span className="kv-value" style={{ fontWeight: '800', color: confirmedBooking.paymentMode === 'Cash' ? '#D97706' : '#2563EB' }}>
                  {confirmedBooking.paymentMode === 'Cash' ? '💵 ' + (t('paymentModeCash') || 'Cash at Mandi Counter') : '🏦 ' + (t('paymentModeOnline') || 'Online (Bank Transfer / DBT)')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                className="btn btn-outline-blue"
                onClick={() => setShowSlipModal(true)}
              >
                <Download size={18} />
                {t('downloadBookingSlip')}
              </button>
              <button
                type="button"
                className="btn btn-gradient"
                onClick={() => setShowSlipModal(true)}
              >
                <Printer size={18} />
                {t('printBookingSlip')}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToDashboard}
            >
              {t('goToDashboard')}
            </button>
          </div>

          {/* Slips and Queue Modals */}
          {showSlipModal && (
            <BookingSlipModal
              booking={confirmedBooking}
              onClose={() => setShowSlipModal(false)}
            />
          )}

          {showQueueModal && (
            <SlotQueueModal
              centreId={confirmedBooking.centreId}
              sessionId={confirmedBooking.sessionId}
              date={confirmedBooking.date}
              timeSlot={confirmedBooking.timeSlot}
              centre={confirmedBooking.centre}
              cropInfo={{ crop: confirmedBooking.crop, variety: confirmedBooking.variety, quantity: confirmedBooking.quantity, unit: confirmedBooking.unit }}
              currentBooking={confirmedBooking}
              isModal={true}
              onClose={() => setShowQueueModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BookSlotFlow;
