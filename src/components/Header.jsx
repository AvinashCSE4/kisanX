import React, { useState } from 'react';
import { Bell, User, LogOut, ShieldCheck, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePortalData } from '../context/PortalDataContext';

export const Header = ({ onOpenNotifications, onOpenProfile, onOpenBank }) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const {
    isFarmerLoggedIn,
    isAdminLoggedIn,
    activePortal,
    switchPortal,
    logoutFarmer,
    logoutAdmin,
    notifications,
    farmerProfile,
    startNewCustomerSession
  } = usePortalData();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo-icon">
          <Sprout size={20} />
        </div>
        <div>
          <div className="header-title">{t('portalTitle')}</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Language selector dropdown - ALWAYS VISIBLE */}
        <div className="lang-selector">
          <select
            className="lang-dropdown"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t('language')}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Icon (Only if logged in) */}
        {(isFarmerLoggedIn || isAdminLoggedIn) && (
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenNotifications}
            title={t('notifications')}
            aria-label={t('notifications')}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge-dot" />}
          </button>
        )}

        {/* Farmer Profile Quick Icon */}
        {isFarmerLoggedIn && activePortal === 'farmer' && (
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenProfile}
            title={farmerProfile.fullName || t('profile')}
            aria-label={t('profile')}
          >
            <User size={20} />
          </button>
        )}

        {/* Admin/Farmer Mode Indicator / Switcher */}
        {activePortal === 'admin' ? (
          <button
            type="button"
            className="btn btn-small"
            style={{ backgroundColor: '#FFFFFF', color: '#1B5E20', fontWeight: 'bold' }}
            onClick={() => switchPortal('farmer')}
            title="Switch to Farmer Portal"
          >
            👨‍🌾 {t('farmer')}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-small"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '13px' }}
            onClick={() => switchPortal('admin')}
            title="Switch to Admin Portal"
          >
            <ShieldCheck size={16} style={{ marginRight: '4px' }} />
            Admin
          </button>
        )}

        {/* New Customer Login Link - Preserves other 50 bookings data */}
        <a
          href="#new-customer"
          onClick={(e) => {
            e.preventDefault();
            startNewCustomerSession();
            window.location.hash = 'new-customer';
          }}
          className="btn btn-small header-new-customer-btn"
          style={{
            backgroundColor: '#FFF8E1',
            color: '#B78103',
            border: '1.5px solid #FFE082',
            fontWeight: '700',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Load Login Page for New Customer (Existing data preserved)"
        >
          <span>👤</span>
          <span>{t('newCustomerLogin') || 'New Customer'}</span>
        </a>

        {/* Logout */}
        {(isFarmerLoggedIn && activePortal === 'farmer') && (
          <button
            type="button"
            className="icon-btn"
            onClick={logoutFarmer}
            title={t('logout')}
            aria-label={t('logout')}
          >
            <LogOut size={18} />
          </button>
        )}
        {(isAdminLoggedIn && activePortal === 'admin') && (
          <button
            type="button"
            className="icon-btn"
            onClick={logoutAdmin}
            title={t('logout')}
            aria-label={t('logout')}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
