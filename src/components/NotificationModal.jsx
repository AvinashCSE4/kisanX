import React from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePortalData } from '../context/PortalDataContext';

export const NotificationModal = ({ onClose }) => {
  const { t } = useLanguage();
  const { notifications } = usePortalData();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '18px', color: 'var(--color-primary-dark)' }}>{t('notifications')}</h2>
          </div>
          <button type="button" className="icon-btn" style={{ color: 'var(--color-text-main)' }} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0' }}>
            {t('noNotifications')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  borderLeft: '4px solid var(--color-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--color-primary-dark)' }}>{n.title}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{n.date}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--color-text-main)', lineHeight: '1.4' }}>{n.message}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
