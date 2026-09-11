import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, Save, AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import { maskAccountNumber } from '../../utils/idGenerator';

export const BankDetails = () => {
  const { t } = useLanguage();
  const { bankDetails, updateBankDetails } = usePortalData();

  const [accountHolder, setAccountHolder] = useState(bankDetails.accountHolder || '');
  const [bankName, setBankName] = useState(bankDetails.bankName || '');
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber || '');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(bankDetails.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(bankDetails.ifscCode || '');

  useEffect(() => {
    setAccountHolder(bankDetails.accountHolder || '');
    setBankName(bankDetails.bankName || '');
    setAccountNumber(bankDetails.accountNumber || '');
    setConfirmAccountNumber(bankDetails.accountNumber || '');
    setIfscCode(bankDetails.ifscCode || '');
  }, [bankDetails]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveBank = (e) => {
    e.preventDefault();
    if (accountNumber !== confirmAccountNumber) {
      setErrorMsg(t('accountMismatchError'));
      return;
    }
    if (ifscCode.trim().length !== 11) {
      setErrorMsg(t('invalidIfscError'));
      return;
    }

    setErrorMsg('');
    updateBankDetails({
      accountHolder,
      bankName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase()
    });

    setSuccessMsg(t('bankDetailsSaved'));
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="main-content">
      <h1 className="page-title">{t('bankDetailsTitle')}</h1>

      {/* CRITICAL NOTICE: Farmer is RECEIVING money, never paying */}
      <div className="info-banner-wheat info-banner" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <ShieldCheck size={26} color="var(--color-accent-wheat)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '15px', color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
              DIRECT BENEFIT TRANSFER (DBT)
            </strong>
            <p style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {t('bankDetailsNotice')}
            </p>
          </div>
        </div>
      </div>

      {/* Currently Saved Masked Account Badge */}
      <div className="card card-highlight" style={{ padding: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-dark)', fontSize: '14px', fontWeight: 'bold' }}>
          <Lock size={16} />
          {t('maskedAccount')}
        </div>
        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-primary-dark)', letterSpacing: '2px', marginTop: '6px' }}>
          {maskAccountNumber(bankDetails.accountNumber)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {bankDetails.bankName} • IFSC: {bankDetails.ifscCode}
        </div>
      </div>

      {successMsg && (
        <div className="info-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={20} color="var(--color-primary)" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="info-banner-warning info-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={20} color="var(--color-danger)" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveBank} className="card">
        {/* Account Holder Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="accHolder">
            {t('accountHolder')} *
          </label>
          <input
            id="accHolder"
            type="text"
            className="form-input"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder={t('accountHolderPlaceholder')}
            required
          />
        </div>

        {/* Bank Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="bankNameInput">
            {t('bankName')}
          </label>
          <input
            id="bankNameInput"
            type="text"
            className="form-input"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder={t('bankNamePlaceholder')}
            required
          />
        </div>

        {/* Account Number */}
        <div className="form-group">
          <label className="form-label" htmlFor="accNumber">
            {t('accountNumber')}
          </label>
          <input
            id="accNumber"
            type="password"
            className="form-input"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder={t('accountNumberPlaceholder')}
            required
          />
        </div>

        {/* Confirm Account Number */}
        <div className="form-group">
          <label className="form-label" htmlFor="confirmAccNumber">
            {t('confirmAccountNumber')}
          </label>
          <input
            id="confirmAccNumber"
            type="text"
            className="form-input"
            value={confirmAccountNumber}
            onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder={t('confirmAccountNumberPlaceholder')}
            required
          />
        </div>

        {/* IFSC Code */}
        <div className="form-group">
          <label className="form-label" htmlFor="ifscInput">
            {t('ifscCode')}
          </label>
          <input
            id="ifscInput"
            type="text"
            className="form-input"
            style={{ textTransform: 'uppercase' }}
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            placeholder={t('ifscPlaceholder')}
            maxLength={11}
            required
          />
        </div>

        {/* Save Button (NO PAY BUTTON) */}
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

export default BankDetails;
