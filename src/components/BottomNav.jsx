import React from 'react';
import { Home, Calendar, PlusCircle, CreditCard, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'bookings', label: t('myBookings'), icon: Calendar },
    { id: 'sell', label: t('sellCrop'), icon: PlusCircle, isHighlight: true },
    { id: 'payment', label: t('payment'), icon: CreditCard },
    { id: 'profile', label: t('profile'), icon: User }
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <IconComponent
              size={tab.isHighlight ? 24 : 22}
              color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
