import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  ShoppingBag,
  Search,
  PlusCircle,
  Building2,
  Users,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Database
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import {
  CENTRES_CONFIG,
  SESSIONS_CONFIG,
  getCentreConfig,
  getSessionConfig,
  calculateCentreLoad,
  calculateSessionQueue,
  generateCentreToken,
  DEFAULT_PROCESSING_TIME
} from '../../utils/smartQueueEngine';

const DATES_LIST = [
  '10 September 2026',
  '11 September 2026',
  '12 September 2026',
  '13 September 2026',
  '14 September 2026'
];

export const AdminDashboard = ({ onNavigate, onNavigateToFarmerDb, onNavigateToBookingDb }) => {
  const { t } = useLanguage();
  const {
    bookings,
    liveServingTokens,
    getLiveServingToken,
    advanceCentreQueueToken,
    updateBookingStatus,
    markBookingMissed
  } = usePortalData();

  // Filter state for Queue Control Centre
  const [selectedCentreId, setSelectedCentreId] = useState('apmc-main');
  const [selectedDate, setSelectedDate] = useState('10 September 2026');
  const [selectedSessionId, setSelectedSessionId] = useState('session-1');

  // Resolved configs
  const activeCentre = getCentreConfig(selectedCentreId);
  const activeSession = getSessionConfig(selectedSessionId);

  // High-level Metrics
  const totalBookings = bookings.length;
  const todaysBookings = bookings.filter(b => b.date === selectedDate).length;
  const pendingSales = bookings.filter(b => b.status !== 'Sale Completed').length;
  const completedSales = bookings.filter(b => b.status === 'Sale Completed').length;

  // Session bookings for active Centre + Date + Session
  const sessionBookings = bookings.filter(b => {
    const matchCentre = (b.centreId === activeCentre.id) || (b.centre && b.centre.toLowerCase().includes(activeCentre.name.toLowerCase()));
    const matchDate = b.date === selectedDate;
    const matchSession = (b.sessionId === activeSession.id) || (b.timeSlot && b.timeSlot.includes(activeSession.time));
    const notCancelled = b.status !== 'Cancelled' && b.status !== 'Rescheduled';
    return matchCentre && matchDate && matchSession && notCancelled;
  }).sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Current live serving token for active Centre + Date + Session
  const liveServingIndex = getLiveServingToken(activeCentre.id, selectedDate, activeSession.id);
  const liveServingTokenStr = generateCentreToken(activeCentre.id, liveServingIndex);

  // Booking currently being served (if exists)
  const currentlyServingBooking = sessionBookings.find(b => (b.tokenNumber || 1) === liveServingIndex);

  // Handle Advancing Queue
  const handleAdvanceQueue = () => {
    advanceCentreQueueToken(activeCentre.id, selectedDate, activeSession.id);
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            🕹️ {t('queueControlCentre') || 'Procurement Queue Control Centre'}
          </h1>
          <p className="subtitle" style={{ margin: 0 }}>
            Live load, queue orchestration, and farmer intake across all 4 Mandi centres
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-small"
            style={{ backgroundColor: '#0D9488', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            onClick={() => onNavigate('database')}
          >
            <Database size={16} />
            Database & Backend
          </button>
          <button
            type="button"
            className="btn btn-blue btn-small"
            onClick={() => onNavigate('search')}
          >
            <Search size={16} />
            {t('adminNavSearch')}
          </button>
          <button
            type="button"
            className="btn btn-outline-blue btn-small"
            onClick={() => onNavigate('bookings')}
          >
            <Users size={16} />
            {t('adminNavBookings')} ({totalBookings})
          </button>
        </div>
      </div>

      {/* 2 Master Database Clicking Buttons Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🗄️</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
              Master Database Portals
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
              Direct SQLite database queries with search, filters & export
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="dash-btn-farmer-db"
            onClick={() => onNavigateToFarmerDb ? onNavigateToFarmerDb() : onNavigate('farmer-database')}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            <span>👨‍🌾</span>
            <span>Farmer Database (15 Fields)</span>
          </button>

          <button
            type="button"
            id="dash-btn-booking-db"
            onClick={() => onNavigateToBookingDb ? onNavigateToBookingDb() : onNavigate('booking-database')}
            style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
            }}
          >
            <span>📋</span>
            <span>Booking Database ({totalBookings} Slots)</span>
          </button>
        </div>
      </div>

      {/* Backend & Database Live Status Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: '#F0FDFA',
        border: '1px solid #99F6E4',
        borderRadius: '10px',
        marginBottom: '20px',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F766E', fontWeight: '800' }}>
            <Database size={16} color="#0D9488" />
            SQLite 3 (node:sqlite)
          </span>
          <span style={{ color: '#94A3B8' }}>•</span>
          <span style={{ color: '#475569' }}>
            Backend: <code style={{ backgroundColor: '#CCFBF1', color: '#0F766E', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>Express :5000 (WAL Mode)</code>
          </span>
          <span style={{ color: '#94A3B8' }}>•</span>
          <span style={{ color: '#475569' }}>
            Dataset: <strong>APMC Main (24)</strong>, <strong>District Hub (20)</strong>, <strong>KVK (3)</strong>, <strong>Taluka (3)</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('database')}
          style={{
            border: 'none',
            backgroundColor: '#0D9488',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View Database & API Info &rarr;
        </button>
      </div>

      {/* Multi-Color High-Level Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card blue-theme">
          <div className="metric-header">
            <span className="metric-label">{t('adminNavBookings') || 'Total Bookings'}</span>
            <div className="metric-icon-box blue">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{totalBookings}</div>
          <div className="metric-subtext">Across all procurement centres</div>
        </div>

        <div className="metric-card green-theme">
          <div className="metric-header">
            <span className="metric-label">{t('todaysBookings') || "Today's Bookings"}</span>
            <div className="metric-icon-box green">
              <Calendar size={20} />
            </div>
          </div>
          <div className="metric-value">{todaysBookings}</div>
          <div className="metric-subtext">{selectedDate} scheduled</div>
        </div>

        <div className="metric-card amber-theme">
          <div className="metric-header">
            <span className="metric-label">{t('pendingSales') || "In-Queue / Pending"}</span>
            <div className="metric-icon-box amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value">{pendingSales}</div>
          <div className="metric-subtext">Awaiting weighing & settlement</div>
        </div>

        <div className="metric-card purple-theme">
          <div className="metric-header">
            <span className="metric-label">{t('completedSales') || "Completed Sales"}</span>
            <div className="metric-icon-box purple">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="metric-value">{completedSales}</div>
          <div className="metric-subtext">Procured & DBT settled</div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="card" style={{ padding: '14px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Centre Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              🏢 {t('filterCentre') || 'Procurement Centre'}
            </label>
            <select
              className="form-select"
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              style={{ fontWeight: 'bold' }}
            >
              {CENTRES_CONFIG.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.prefix})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              📅 {t('date') || 'Procurement Date'}
            </label>
            <select
              className="form-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ fontWeight: 'bold' }}
            >
              {DATES_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              ⏰ {t('filterSession') || '2-Hour Session'}
            </label>
            <select
              className="form-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              style={{ fontWeight: 'bold' }}
            >
              {SESSIONS_CONFIG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================
          CENTRE HEALTH OVERVIEW & LIVE LOAD (4 Centres)
      ================================================== */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1E3A8A' }}>
            📊 {t('centreHealth') || 'Centre Health & Live Load Intelligence'} ({selectedDate})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Capacity Limit: 32 farmers/centre/day
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {CENTRES_CONFIG.map((c) => {
            const load = calculateCentreLoad(c.id, selectedDate, bookings);
            const isSelected = selectedCentreId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCentreId(c.id)}
                style={{
                  border: isSelected ? `2.5px solid ${load.loadBadgeColor}` : '1px solid var(--color-border)',
                  borderLeft: `4px solid ${load.loadBadgeColor}`,
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-main)', display: 'block' }}>
                      {c.name}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Prefix: <strong style={{ color: 'var(--color-blue)' }}>{c.prefix}</strong>
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: load.loadBadgeColor,
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    ● {load.loadStatus}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  margin: '8px 0'
                }}>
                  <div style={{
                    width: `${load.capacityPercentage}%`,
                    height: '100%',
                    backgroundColor: load.loadBadgeColor,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>Booked: <strong style={{ color: 'var(--color-text-main)' }}>{load.bookedFarmers} / 32</strong></span>
                  <span>Free: <strong style={{ color: 'var(--color-green)' }}>{load.availableSlots} slots</strong></span>
                  <span style={{ fontWeight: 'bold', color: isSelected ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                    {isSelected ? '✓ Active' : 'Switch →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          CURRENTLY SERVING ORCHESTRATION CARD (BLUE THEME)
      ================================================== */}
      <div className="card card-blue" style={{
        padding: '18px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-booked" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                LIVE QUEUE ORCHESTRATION
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-blue-dark)', fontWeight: '600' }}>
                {activeCentre.name} • {activeSession.time}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
              <div style={{
                backgroundColor: 'var(--color-blue)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: '900',
                letterSpacing: '1px',
                boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
              }}>
                {liveServingTokenStr}
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-blue-dark)', fontWeight: '600' }}>{t('currentlyServing') || 'Currently Serving Token'}</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-main)' }}>
                  {currentlyServingBooking ? `${currentlyServingBooking.farmerName} (${currentlyServingBooking.crop} • ${currentlyServingBooking.quantity} ${currentlyServingBooking.unit})` : 'Waiting for Next Farmer'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-blue"
              style={{ fontSize: '14px', padding: '10px 18px' }}
              onClick={handleAdvanceQueue}
              disabled={liveServingIndex >= 8}
            >
              <RotateCw size={16} />
              {t('advanceQueue') || 'Advance to Next Token'} →
            </button>
            {currentlyServingBooking && (
              <button
                type="button"
                className="btn btn-outline-blue"
                style={{ fontSize: '14px' }}
                onClick={() => onNavigate('search')}
              >
                Inspect ID: {currentlyServingBooking.sellingId}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          NEXT IN QUEUE LIST & INTAKE CONTROLS
      ================================================== */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>
              👥 {t('nextInQueue') || 'Session Queue & Farmer Intake'} ({sessionBookings.length} of 8 booked)
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {activeCentre.name} • {selectedDate} ({activeSession.time})
            </span>
          </div>

          <span className="badge badge-paid" style={{ fontSize: '12px' }}>
            15 Min / Farmer Turn
          </span>
        </div>

        {sessionBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
            No farmers booked for this centre and session yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>{t('sellingId')}</th>
                  <th>{t('farmer')}</th>
                  <th>{t('crop')}</th>
                  <th>Turn Time</th>
                  <th>Arrival</th>
                  <th>{t('paymentMode')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessionBookings.map((b, idx) => {
                  const tokenStr = b.centreToken || generateCentreToken(activeCentre.id, b.tokenNumber || (idx + 1));
                  const isServing = (b.tokenNumber || (idx + 1)) === liveServingIndex;

                  return (
                    <tr
                      key={b.id || b.sellingId}
                      style={{
                        backgroundColor: isServing ? '#EFF6FF' : b.status === 'Missed' ? '#FEF2F2' : '#FFFFFF'
                      }}
                    >
                      <td>
                        <span style={{
                          backgroundColor: isServing ? 'var(--color-blue)' : 'var(--color-blue-bg)',
                          color: isServing ? '#FFFFFF' : 'var(--color-blue-dark)',
                          fontWeight: '900',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: isServing ? 'none' : '1px solid var(--color-blue-border)',
                          boxShadow: isServing ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
                        }}>
                          {tokenStr}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-blue)' }}>
                        {b.sellingId}
                      </td>
                      <td>
                        <div><strong>{b.farmerName}</strong></div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+91 {b.mobileNumber}</div>
                      </td>
                      <td>
                        {b.crop} ({b.quantity} {b.unit})
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-blue-dark)' }}>
                        {b.estimatedTurnTime || '08:00 AM'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {b.recommendedArrivalTime || b.reportGateTime || '10m prior'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: b.paymentMode === 'Cash' ? 'var(--color-amber-dark)' : 'var(--color-blue)'
                        }}>
                          {b.paymentMode === 'Cash' ? '💵 Cash' : '🏦 Online'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          b.status === 'Sale Completed' ? 'badge-completed' :
                          b.status === 'Weighed' ? 'badge-weighed' :
                          b.status === 'Crop Verified' ? 'badge-verified' :
                          b.status === 'Arrived' ? 'badge-arrived' :
                          b.status === 'Missed' ? 'badge-danger' :
                          'badge-booked'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {b.status === 'Booked' && (
                            <button
                              type="button"
                              className="btn btn-outline-blue btn-small"
                              style={{ padding: '3px 9px', fontSize: '11px', minHeight: '30px' }}
                              onClick={() => updateBookingStatus(b.sellingId, 'Arrived')}
                            >
                              Arrived
                            </button>
                          )}
                          {b.status === 'Arrived' && (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-small"
                              style={{ padding: '3px 9px', fontSize: '11px', minHeight: '30px' }}
                              onClick={() => updateBookingStatus(b.sellingId, 'Crop Verified')}
                            >
                              Verify
                            </button>
                          )}
                          {b.status === 'Crop Verified' && (
                            <button
                              type="button"
                              className="btn btn-amber btn-small"
                              style={{ padding: '3px 9px', fontSize: '11px', minHeight: '30px' }}
                              onClick={() => updateBookingStatus(b.sellingId, 'Weighed')}
                            >
                              Weigh
                            </button>
                          )}
                          {b.status === 'Weighed' && (
                            <button
                              type="button"
                              className="btn btn-purple btn-small"
                              style={{ padding: '3px 9px', fontSize: '11px', minHeight: '30px' }}
                              onClick={() => onNavigate('search')}
                            >
                              Disburse
                            </button>
                          )}
                          {b.status !== 'Sale Completed' && b.status !== 'Missed' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              style={{ padding: '3px 7px', fontSize: '11px', minHeight: '30px' }}
                              onClick={() => markBookingMissed(b.sellingId)}
                              title="Mark farmer absent/missed"
                            >
                              Missed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
