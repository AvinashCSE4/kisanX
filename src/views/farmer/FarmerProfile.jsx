import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, CreditCard, User, Building } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import VoiceInput from '../../components/VoiceInput';

export const FarmerProfile = ({ onNavigateToBank }) => {
  const { t } = useLanguage();
  const { farmerProfile, updateFarmerProfile } = usePortalData();

  const [formData, setFormData] = useState({ ...farmerProfile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData({ ...farmerProfile });
  }, [farmerProfile]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFarmerProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="main-content">
      {/* Title */}
      <h1 className="page-title">{t('farmerDetailsTitle')}</h1>
      <p className="subtitle">{t('farmerDetailsSubtitle')}</p>

      {/* Quick link to Bank details */}
      <div
        className="card card-wheat"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '20px' }}
        onClick={onNavigateToBank}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={24} color="var(--color-accent-wheat)" />
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{t('bankDetailsTitle')}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>To receive crop sales payments directly</div>
          </div>
        </div>
        <span style={{ fontSize: '18px', color: 'var(--color-accent-wheat)', fontWeight: 'bold' }}>→</span>
      </div>

      {saveSuccess && (
        <div className="info-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={20} color="var(--color-primary)" />
          <span>{t('profileSavedSuccess')}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        {/* Full Name with Mic */}
        <div className="form-group">
          <label className="form-label" htmlFor="fullNameInput">
            {t('fullName')}
          </label>
          <div className="input-with-mic">
            <input
              id="fullNameInput"
              type="text"
              className="form-input"
              value={formData.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              required
            />
            <VoiceInput
              fieldName={t('fullName')}
              onResult={(text) => handleChange('fullName', text)}
            />
          </div>
        </div>

        {/* Farmer ID Card (11 digits - Verified) */}
        <div className="form-group">
          <label className="form-label" htmlFor="farmerIdCard">
            {t('farmerIdCard') || 'Farmer ID Card (11 digits)'}
          </label>
          <input
            id="farmerIdCard"
            type="text"
            className="form-input"
            style={{
              backgroundColor: '#F9FBF9',
              fontWeight: '600',
              letterSpacing: '1px',
              fontFamily: 'monospace'
            }}
            value={formData.farmerIdCard || ''}
            onChange={(e) => handleChange('farmerIdCard', e.target.value.replace(/\D/g, '').slice(0, 11))}
            maxLength={11}
            placeholder={t('farmerIdCardPlaceholder') || 'e.g. 10020030040'}
          />
          <span style={{ fontSize: '12px', color: 'var(--color-primary-dark)', marginTop: '4px', display: 'inline-block' }}>
            ✓ Verified Farmer Identity Document (11 digits)
          </span>
        </div>

        {/* Mobile Number */}
        <div className="form-group">
          <label className="form-label" htmlFor="profileMobile">
            {t('mobileNumber')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              backgroundColor: '#EEEEEE',
              border: '1.5px solid var(--color-border)',
              borderRight: 'none',
              height: 'var(--input-height)',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: '700',
              borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)'
            }}>
              +91
            </span>
            <input
              id="profileMobile"
              type="tel"
              className="form-input"
              style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
              value={formData.mobileNumber || ''}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              maxLength={10}
              required
            />
          </div>
        </div>

        {/* Village with Mic */}
        <div className="form-group">
          <label className="form-label" htmlFor="villageInput">
            {t('village')}
          </label>
          <div className="input-with-mic">
            <input
              id="villageInput"
              type="text"
              className="form-input"
              value={formData.village || ''}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder={t('villagePlaceholder')}
              required
            />
            <VoiceInput
              fieldName={t('village')}
              onResult={(text) => handleChange('village', text)}
            />
          </div>
        </div>

        {/* Taluka with Mic */}
        <div className="form-group">
          <label className="form-label" htmlFor="talukaInput">
            {t('taluka')}
          </label>
          <div className="input-with-mic">
            <input
              id="talukaInput"
              type="text"
              className="form-input"
              value={formData.taluka || ''}
              onChange={(e) => handleChange('taluka', e.target.value)}
              placeholder={t('talukaPlaceholder')}
            />
            <VoiceInput
              fieldName={t('taluka')}
              onResult={(text) => handleChange('taluka', text)}
            />
          </div>
        </div>

        {/* District with Mic */}
        <div className="form-group">
          <label className="form-label" htmlFor="districtInput">
            {t('district')}
          </label>
          <div className="input-with-mic">
            <input
              id="districtInput"
              type="text"
              className="form-input"
              value={formData.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder={t('districtPlaceholder')}
              required
            />
            <VoiceInput
              fieldName={t('district')}
              onResult={(text) => handleChange('district', text)}
            />
          </div>
        </div>

        {/* State */}
        <div className="form-group">
          <label className="form-label" htmlFor="stateInput">
            {t('state')}
          </label>
          <div className="input-with-mic">
            <input
              id="stateInput"
              type="text"
              className="form-input"
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder={t('statePlaceholder')}
              required
            />
            <VoiceInput
              fieldName={t('state')}
              onResult={(text) => handleChange('state', text)}
            />
          </div>
        </div>

        {/* Address with Mic */}
        <div className="form-group">
          <label className="form-label" htmlFor="addressInput">
            {t('address')}
          </label>
          <div className="input-with-mic">
            <textarea
              id="addressInput"
              className="form-textarea"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t('addressPlaceholder')}
              rows={3}
            />
            <VoiceInput
              fieldName={t('address')}
              onResult={(text) => handleChange('address', text)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={18} />
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FarmerProfile;
