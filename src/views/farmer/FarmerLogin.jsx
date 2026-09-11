import React, { useState } from 'react';
import { Smartphone, CheckCircle, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';

export const FarmerLogin = ({ onSwitchToAdmin }) => {
  const { t } = useLanguage();
  const { loginFarmer, startNewCustomerSession, resetTo3BookingsPerSession } = usePortalData();

  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobileNumber, setMobileNumber] = useState('');
  const [farmerIdCard, setFarmerIdCard] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    const cleanId = farmerIdCard.replace(/\D/g, '');
    if (cleanId.length !== 11) {
      setErrorMsg(t('invalidFarmerId') || 'Please enter a valid 11-digit Farmer ID Card number');
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg(t('invalidMobile'));
      return;
    }

    setErrorMsg('');
    setStep('otp');
    setOtp('');
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.trim() !== '123456') {
      setErrorMsg(t('invalidOtp') || 'Invalid OTP. Please enter demo OTP: 123456');
      return;
    }
    setErrorMsg('');
    loginFarmer(mobileNumber, farmerIdCard);
  };

  const handleUseDemoCreds = () => {
    setFarmerIdCard('10020030040');
    setMobileNumber('9876543210');
    setErrorMsg('');
  };

  return (
    <div style={{ padding: '24px 16px', maxWidth: '450px', margin: '0 auto' }}>
      {/* Portal Branding */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '14px',
          background: 'linear-gradient(135deg, #0D9488 0%, #2563EB 50%, #7C3AED 100%)',
          borderRadius: '50%',
          color: '#FFFFFF',
          marginBottom: '10px',
          boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25)'
        }}>
          <Smartphone size={32} />
        </div>
        <h1 style={{ fontSize: '28px', color: '#0F172A', fontWeight: '800', letterSpacing: '-0.5px' }}>
          {t('portalTitle')}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {t('farmerLoginTitle')}
        </p>
      </div>

      {step === 'mobile' ? (
        <form onSubmit={handleSendOtp} className="card" style={{ padding: '24px', borderTop: '4px solid #2563EB', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
          {/* Quick Notice Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
            border: '1px solid #C7D2FE',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: '#3730A3',
            marginBottom: '18px',
            textAlign: 'center',
            lineHeight: '1.45',
            fontWeight: '500'
          }}>
            ✨ <strong>{t('newCustomerNotice') || 'New Customer Mode Active: Each 2-hour session contains 3 registered bookings (Tokens 1, 2 & 3). Your new booking gets Token #4.'}</strong>
          </div>

          {/* Farmer ID Card (11 Digits) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="farmerIdInput" style={{ margin: 0, fontWeight: '700' }}>
                {t('farmerIdCard') || 'Farmer ID Card (11 Digits)'} *
              </label>
              <button
                type="button"
                onClick={handleUseDemoCreds}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {t('demoFarmerIdHint') || 'Use Demo: 10020030040'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="farmerIdInput"
                type="text"
                className="form-input"
                style={{
                  fontWeight: '700',
                  letterSpacing: '1.5px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  borderColor: '#93C5FD'
                }}
                placeholder={t('farmerIdCardPlaceholder') || 'e.g. 10020030040 (11 digits)'}
                value={farmerIdCard}
                onChange={(e) => setFarmerIdCard(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
                required
                autoFocus
              />
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Enter your official 11-digit Government Farmer Registration Card Number
            </span>
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="mobileInput" style={{ fontWeight: '700' }}>
              {t('enterMobile')} *
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                backgroundColor: '#F1F5F9',
                border: '1.5px solid var(--color-border)',
                borderRight: 'none',
                height: 'var(--input-height)',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--border-radius-md) 0 0 var(--border-radius-md)',
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--color-text-muted)'
              }}>
                +91
              </span>
              <input
                id="mobileInput"
                type="tel"
                className="form-input"
                style={{
                  borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0',
                  fontSize: '16px',
                  letterSpacing: '1px',
                  fontWeight: '600'
                }}
                placeholder={t('mobilePlaceholder')}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Demo Farmer Credentials Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '12.5px'
          }}>
            <div style={{ fontWeight: '700', color: '#1E293B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={15} color="#2563EB" />
              <span>{t('demoAccountTitle') || 'Quick Demo Login Credentials:'}</span>
            </div>
            <div style={{ color: '#475569', lineHeight: '1.6' }}>
              <div>• <strong>Farmer ID:</strong> <code style={{ backgroundColor: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>10020030040</code></div>
              <div>• <strong>Mobile No:</strong> <code style={{ backgroundColor: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>9876543210</code></div>
              <div>• <strong>Demo OTP:</strong> <code style={{ backgroundColor: '#FEF3C7', padding: '1px 5px', borderRadius: '4px', color: '#92400E', fontWeight: 'bold' }}>123456</code></div>
            </div>
          </div>

          {errorMsg && (
            <div className="info-banner-warning info-banner" style={{ margin: '10px 0' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-gradient" style={{ width: '100%', fontSize: '15px' }}>
              <ShieldCheck size={18} />
              {t('sendOtp')}
            </button>
          </div>

          {/* Direct Fresh URL hint */}
          <div style={{
            marginTop: '16px',
            padding: '10px 12px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '6px',
            fontSize: '11.5px',
            color: '#78350F',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: '700', marginBottom: '3px' }}>
              💡 Bookmark or open anytime for a fresh session:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <code style={{
                backgroundColor: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #FCD34D',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#92400E'
              }}>
                http://localhost:5173/#new-customer
              </code>
              <a
                href="#new-customer"
                onClick={(e) => {
                  e.preventDefault();
                  startNewCustomerSession();
                  window.location.hash = 'new-customer';
                  setFarmerIdCard('');
                  setMobileNumber('');
                  setErrorMsg('');
                }}
                style={{
                  color: '#B45309',
                  fontWeight: '700',
                  textDecoration: 'underline',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Reset & Open Fresh
              </a>
            </div>
          </div>

          {/* Reset all data button */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                resetTo3BookingsPerSession();
                setFarmerIdCard('');
                setMobileNumber('');
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: '11.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
                opacity: 0.9,
                fontWeight: '600'
              }}
              title="Reset all system bookings to clean 3-bookings per 2-hour session state"
            >
              🔄 Reset all data to 3 bookings per session
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="card" style={{ padding: '24px', borderTop: '4px solid #7C3AED', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
          {/* New Customer Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
            border: '1px solid #C7D2FE',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#3730A3',
            marginBottom: '16px',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            ✨ <strong>{t('newCustomerNotice') || 'New Customer Mode Active: Each 2-hour session contains 3 registered bookings (Tokens 1, 2 & 3). Your new booking gets Token #4.'}</strong>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '22px', color: '#0F172A', fontWeight: '800' }}>{t('otpTitle')}</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t('otpSubtitle')} <strong>+91 {mobileNumber}</strong>
            </p>

            {/* Authenticated Farmer ID Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F3F4F6',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#4B5563',
              marginTop: '8px'
            }}>
              <ShieldCheck size={14} color="#16A34A" />
              <span>Card: <strong>{farmerIdCard}</strong></span>
            </div>

            {/* Demo OTP Hint Badge */}
            <div style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}>
              {t('demoOtpHint') || 'Demo OTP: 123456'}
            </div>
          </div>

          <div className="form-group">
            <input
              id="otpInput"
              type="text"
              className="form-input"
              style={{
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '8px',
                fontWeight: '700',
                height: '56px',
                borderColor: '#C084FC'
              }}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="123456"
              required
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="info-banner-warning info-banner" style={{ margin: '10px 0' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="btn btn-gradient" style={{ fontSize: '15px' }}>
              <CheckCircle size={18} />
              {t('verifyOtp')}
            </button>
            <button
              type="button"
              className="btn btn-outline-blue"
              onClick={() => {
                setStep('mobile');
                setErrorMsg('');
              }}
            >
              <ArrowLeft size={18} />
              {t('changeMobile')}
            </button>
          </div>
        </form>
      )}

      {/* Switch to Admin Login link */}
      <div style={{ textAlign: 'center', marginTop: '28px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={onSwitchToAdmin}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563EB',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline'
          }}
        >
          {t('adminLoginLink')}
        </button>
      </div>
    </div>
  );
};

export default FarmerLogin;
