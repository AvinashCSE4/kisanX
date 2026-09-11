import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Search,
  Users,
  ShoppingBag,
  CreditCard,
  FileBarChart,
  Database,
  LogOut,
  Sprout,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import AdminDashboard from './AdminDashboard';
import AdminBookings from './AdminBookings';
import AdminBookingDatabase from './AdminBookingDatabase';
import AdminFarmerDatabase from './AdminFarmerDatabase';
import AdminSearchId from './AdminSearchId';
import AdminBackendInfo from './AdminBackendInfo';

export const AdminLayout = ({ onSwitchToFarmer }) => {
  const { t, language, setLanguage, languages } = useLanguage();
  const { logoutAdmin, bookings, farmerProfile, startNewCustomerSession } = usePortalData();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedSellingId, setSelectedSellingId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('adminNavDashboard'), icon: LayoutDashboard, color: '#2563EB' },
    { id: 'farmer-database', label: '👨‍🌾 Farmer Database', icon: Users, color: '#0284C7' },
    { id: 'booking-database', label: '📋 Booking Database', icon: Calendar, color: '#4F46E5' },
    { id: 'database', label: 'Database & Backend', icon: Database, color: '#0D9488' },
    { id: 'search', label: t('adminNavSearch'), icon: Search, color: '#059669' },
    { id: 'sales', label: t('adminNavSales'), icon: ShoppingBag, color: '#D97706' },
    { id: 'payments', label: t('adminNavPayments'), icon: CreditCard, color: '#7C3AED' },
    { id: 'reports', label: t('adminNavReports'), icon: FileBarChart, color: '#E11D48' }
  ];

  const handleSelectBooking = (sellingId) => {
    setSelectedSellingId(sellingId);
    setCurrentTab('search');
  };

  const isFarmerDbActive = currentTab === 'farmer-database' || currentTab === 'farmers';
  const isBookingDbActive = currentTab === 'booking-database' || currentTab === 'bookings';

  return (
    <div className="admin-layout">
      {/* Sidebar for Laptop/Desktop (Section 20) */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="header-logo-icon" style={{ backgroundColor: '#FFFFFF', color: '#1E40AF' }}>
            <Sprout size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.3px' }}>{t('portalTitle')}</div>
            <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: '600', color: '#93C5FD' }}>Procurement Admin Portal</div>
          </div>
        </div>

        <ul className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id ||
              (item.id === 'farmer-database' && currentTab === 'farmers') ||
              (item.id === 'booking-database' && currentTab === 'bookings');

            return (
              <li key={item.id} className="admin-menu-item">
                <button
                  type="button"
                  className={`admin-menu-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                    borderLeftColor: isActive ? item.color : 'transparent',
                    color: isActive ? item.color : '#334155',
                    fontWeight: isActive ? '800' : '600'
                  }}
                >
                  <IconComponent size={19} color={isActive ? item.color : item.color} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Bottom Sidebar Action Buttons */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            type="button"
            className="btn btn-outline-blue btn-small"
            style={{ width: '100%', marginBottom: '8px' }}
            onClick={onSwitchToFarmer}
          >
            👨‍🌾 Switch to Farmer View
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ width: '100%', color: 'var(--color-danger)' }}
            onClick={logoutAdmin}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top bar (Professional Blue Theme) */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '12px',
              backgroundColor: '#EFF6FF',
              color: '#1E40AF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '800',
              border: '1px solid #BFDBFE'
            }}>
              🏢 APMC MANDI
            </span>
            <span style={{ fontWeight: '800', color: '#1E3A8A', fontSize: '15px' }}>
              Yard Control Centre: Main Yard (AM)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 2 CLICKING BUTTONS: Farmer Database & Booking Database */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {/* Button 1: Farmer Database */}
              <button
                type="button"
                id="btn-farmer-database"
                onClick={() => setCurrentTab('farmer-database')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: isFarmerDbActive ? '1px solid #0284C7' : '1px solid transparent',
                  backgroundColor: isFarmerDbActive ? '#0284C7' : 'transparent',
                  color: isFarmerDbActive ? '#FFFFFF' : '#334155',
                  boxShadow: isFarmerDbActive ? '0 2px 6px rgba(2, 132, 199, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Open Master Farmer Database (15 Fields)"
              >
                <span>👨‍🌾</span>
                <span>Farmer Database</span>
              </button>

              {/* Button 2: Booking Database */}
              <button
                type="button"
                id="btn-booking-database"
                onClick={() => setCurrentTab('booking-database')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: isBookingDbActive ? '1px solid #4F46E5' : '1px solid transparent',
                  backgroundColor: isBookingDbActive ? '#4F46E5' : 'transparent',
                  color: isBookingDbActive ? '#FFFFFF' : '#334155',
                  boxShadow: isBookingDbActive ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Open Mandi Procurement Booking Database"
              >
                <span>📋</span>
                <span>Booking Database</span>
              </button>
            </div>

            {/* Language Selector */}
            <select
              className="lang-dropdown"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t('language')}
              style={{ border: '1px solid #BFDBFE', color: '#1E40AF', fontWeight: 'bold' }}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.nativeLabel}</option>
              ))}
            </select>

            {/* New Customer Login Link */}
            <a
              href="#new-customer"
              onClick={(e) => {
                e.preventDefault();
                startNewCustomerSession();
                window.location.hash = 'new-customer';
                onSwitchToFarmer();
              }}
              className="btn btn-small header-new-customer-btn"
              style={{
                backgroundColor: '#FFF8E1',
                color: '#B78103',
                border: '1.5px solid #FFE082',
                fontWeight: '700',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title="Load Login Page for New Customer"
            >
              <span>👤</span>
              <span>{t('newCustomerLogin') || 'New Customer'}</span>
            </a>
          </div>
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {currentTab === 'dashboard' && (
            <AdminDashboard
              onNavigate={(tab) => setCurrentTab(tab)}
              onNavigateToFarmerDb={() => setCurrentTab('farmer-database')}
              onNavigateToBookingDb={() => setCurrentTab('booking-database')}
            />
          )}

          {isFarmerDbActive && (
            <AdminFarmerDatabase
              onNavigateToBooking={() => setCurrentTab('booking-database')}
            />
          )}

          {isBookingDbActive && (
            <AdminBookingDatabase
              onSelectBooking={handleSelectBooking}
            />
          )}

          {currentTab === 'database' && (
            <AdminBackendInfo
              onNavigateToFarmerDb={() => setCurrentTab('farmer-database')}
              onNavigateToBookingDb={() => setCurrentTab('booking-database')}
            />
          )}

          {currentTab === 'search' && (
            <AdminSearchId initialSellingId={selectedSellingId} />
          )}

          {currentTab === 'sales' && (
            <div>
              <AdminSearchId initialSellingId={selectedSellingId || ''} />
            </div>
          )}

          {currentTab === 'payments' && (
            <div>
              <AdminSearchId initialSellingId={selectedSellingId || ''} />
            </div>
          )}

          {currentTab === 'reports' && (
            <div>
              <h1 className="page-title">{t('adminNavReports')}</h1>
              <p className="subtitle">Mandi procurement, centre throughput, and DBT summary</p>

              <div className="metrics-grid" style={{ marginBottom: '20px' }}>
                <div className="metric-card green-theme">
                  <div className="metric-header">
                    <span className="metric-label">Total Procured Quantity</span>
                    <div className="metric-icon-box green">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                  <div className="metric-value">
                    {bookings.reduce((sum, b) => sum + (b.status === 'Sale Completed' ? (b.finalQuantity || b.quantity || 0) : 0), 0)} kg
                  </div>
                  <div className="metric-subtext">Physical weighment completed</div>
                </div>

                <div className="metric-card purple-theme">
                  <div className="metric-header">
                    <span className="metric-label">Total DBT Disbursed</span>
                    <div className="metric-icon-box purple">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <div className="metric-value">
                    ₹{bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="metric-subtext">Direct bank transfers settled</div>
                </div>

                <div className="metric-card blue-theme">
                  <div className="metric-header">
                    <span className="metric-label">Total Registered Bookings</span>
                    <div className="metric-icon-box blue">
                      <Calendar size={20} />
                    </div>
                  </div>
                  <div className="metric-value">{bookings.length}</div>
                  <div className="metric-subtext">Across 4 procurement centres</div>
                </div>

                <div className="metric-card amber-theme">
                  <div className="metric-header">
                    <span className="metric-label">Government Standard</span>
                    <div className="metric-icon-box amber">
                      <FileBarChart size={20} />
                    </div>
                  </div>
                  <div className="metric-value" style={{ fontSize: '18px' }}>MSP FAQ</div>
                  <div className="metric-subtext">Fair Average Quality compliant</div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '16px', color: 'var(--color-text-main)', marginBottom: '12px' }}>
                  📊 Settlement Summary by Mode
                </h3>
                <div className="kv-row">
                  <span className="kv-label">Online DBT Disbursements:</span>
                  <span className="kv-value" style={{ color: 'var(--color-blue)', fontWeight: 'bold' }}>
                    {bookings.filter(b => b.paymentMode === 'Online' && b.paymentStatus === 'Paid').length} Completed
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Cash Counter Vouchers:</span>
                  <span className="kv-value" style={{ color: 'var(--color-amber-dark)', fontWeight: 'bold' }}>
                    {bookings.filter(b => b.paymentMode === 'Cash' && b.paymentStatus === 'Paid').length} Completed
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Pending Payouts:</span>
                  <span className="kv-value" style={{ color: 'var(--color-amber-dark)', fontWeight: 'bold' }}>
                    {bookings.filter(b => b.paymentStatus !== 'Paid').length} Awaiting Verification
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
