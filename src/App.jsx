import React, { useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import { usePortalData } from './context/PortalDataContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import NotificationModal from './components/NotificationModal';

// Farmer Views
import FarmerLogin from './views/farmer/FarmerLogin';
import FarmerDashboard from './views/farmer/FarmerDashboard';
import FarmerProfile from './views/farmer/FarmerProfile';
import BookSlotFlow from './views/farmer/BookSlotFlow';
import MyBookings from './views/farmer/MyBookings';
import BankDetails from './views/farmer/BankDetails';
import FarmerPayment from './views/farmer/FarmerPayment';

// Admin Views
import AdminLogin from './views/admin/AdminLogin';
import AdminLayout from './views/admin/AdminLayout';

export const App = () => {
  const { t } = useLanguage();
  const {
    isFarmerLoggedIn,
    isAdminLoggedIn,
    activePortal,
    switchPortal
  } = usePortalData();

  // Mobile navigation tab state
  const [currentFarmerTab, setCurrentFarmerTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  // If active portal is ADMIN
  if (activePortal === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <div className="app-container">
          <Header
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenProfile={() => {}}
            onOpenBank={() => {}}
          />
          <AdminLogin onSwitchToFarmer={() => switchPortal('farmer')} />
        </div>
      );
    }
    return (
      <AdminLayout onSwitchToFarmer={() => switchPortal('farmer')} />
    );
  }

  // Active portal is FARMER
  return (
    <div className="farmer-layout">
      {/* Top Header - Always visible with 3 languages */}
      <Header
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setCurrentFarmerTab('profile')}
        onOpenBank={() => setCurrentFarmerTab('bank')}
      />

      {/* Main Content Area */}
      {!isFarmerLoggedIn ? (
        <FarmerLogin onSwitchToAdmin={() => switchPortal('admin')} />
      ) : (
        <>
          {currentFarmerTab === 'dashboard' && (
            <FarmerDashboard
              onNavigate={(tab) => setCurrentFarmerTab(tab)}
            />
          )}

          {currentFarmerTab === 'bookings' && (
            <MyBookings
              onNavigateToSell={() => setCurrentFarmerTab('sell')}
            />
          )}

          {currentFarmerTab === 'sell' && (
            <BookSlotFlow
              onBookingComplete={() => setCurrentFarmerTab('bookings')}
              onNavigateToDashboard={() => setCurrentFarmerTab('dashboard')}
            />
          )}

          {currentFarmerTab === 'payment' && (
            <FarmerPayment />
          )}

          {currentFarmerTab === 'profile' && (
            <FarmerProfile
              onNavigateToBank={() => setCurrentFarmerTab('bank')}
            />
          )}

          {currentFarmerTab === 'bank' && (
            <BankDetails />
          )}

          {/* Bottom Navigation for Farmer Mobile */}
          <BottomNav
            activeTab={currentFarmerTab}
            onTabChange={(tab) => setCurrentFarmerTab(tab)}
          />
        </>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default App;
