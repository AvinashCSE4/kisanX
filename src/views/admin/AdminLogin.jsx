import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';

export const AdminLogin = ({ onSwitchToFarmer }) => {
  const { t } = useLanguage();
  const { loginAdmin } = usePortalData();

  const [adminId, setAdminId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adminId.trim() === 'admin' && password.trim() === 'admin123') {
      setErrorMsg('');
      loginAdmin();
    } else {
      setErrorMsg(t('invalidAdminCreds'));
    }
  };

  return (
    <div style={{ padding: '32px 16px', maxWidth: '440px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          backgroundColor: '#EFF6FF',
          borderRadius: '50%',
          color: '#1D4ED8',
          marginBottom: '10px',
          border: '2px solid #BFDBFE',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
        }}>
          <ShieldCheck size={36} />
        </div>
        <h1 style={{ fontSize: '26px', color: '#1E3A8A', fontWeight: '800', letterSpacing: '-0.5px' }}>
          {t('adminPortal')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {t('adminLoginTitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', borderTop: '4px solid #2563EB', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="adminIdInput">
            {t('adminId')}
          </label>
          <input
            id="adminIdInput"
            type="text"
            className="form-input"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder={t('adminIdPlaceholder')}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="adminPasswordInput">
            {t('adminPassword')}
          </label>
          <input
            id="adminPasswordInput"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('adminPasswordPlaceholder')}
            required
          />
        </div>

        {errorMsg && (
          <div className="info-banner-warning info-banner" style={{ margin: '10px 0' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn btn-blue" style={{ width: '100%', fontSize: '15px' }}>
            {t('adminLoginBtn')}
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '12.5px',
          color: '#1E40AF',
          backgroundColor: '#EFF6FF',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #BFDBFE'
        }}>
          🔑 Demo Officer: <strong>admin</strong> | Password: <strong>admin123</strong>
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={onSwitchToFarmer}
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
          {t('farmerLoginLink')}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
