import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  HardDrive,
  Activity,
  Cpu,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Table,
  Zap,
  Shield,
  FileText,
  Cloud,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import supabaseService from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { usePortalData } from '../../context/PortalDataContext';

export const AdminBackendInfo = ({ onNavigateToFarmerDb, onNavigateToBookingDb }) => {
  const { bookings, resetTo3BookingsPerSession } = usePortalData();

  const isSupabase = supabaseService.isConfigured();
  const [supabaseSeedLoading, setSupabaseSeedLoading] = useState(false);
  const [supabaseSeedMsg, setSupabaseSeedMsg] = useState('');

  const [healthData, setHealthData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [liveQueues, setLiveQueues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState('');
  const [activeSubTab, setActiveSubTab] = useState(isSupabase ? 'supabase' : 'overview'); // 'overview' | 'supabase' | 'tables' | 'endpoints' | 'raw'
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState('');

  const fetchBackendData = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [health, stats, queues] = await Promise.all([
        api.checkHealth(),
        api.getAdminStats().catch(() => null),
        api.getLiveQueues().catch(() => null)
      ]);
      const latency = Math.round(performance.now() - start);

      setHealthData(health ? { ...health, latency } : null);
      if (stats?.success) setAdminStats(stats.data);
      if (queues?.success) setLiveQueues(queues.data);
      setLastCheckTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Error fetching backend info:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed the database with the 50-item venue load dataset?')) return;
    setReseedLoading(true);
    try {
      await api.resetDatabase();
      await resetTo3BookingsPerSession();
      await fetchBackendData();
      setReseedSuccess('Database reset and seeded successfully!');
      setTimeout(() => setReseedSuccess(''), 4000);
    } catch (err) {
      alert('Error re-seeding: ' + err.message);
    } finally {
      setReseedLoading(false);
    }
  };

  const handleSeedSupabase = async () => {
    if (!window.confirm('Seed or refresh Supabase PostgreSQL with 50 bookings, 50 farmers, 4 centres, and 4 sessions?')) return;
    setSupabaseSeedLoading(true);
    setSupabaseSeedMsg('');
    try {
      const res = await supabaseService.seedDemoData();
      setSupabaseSeedMsg(`✅ Successfully seeded ${res.seededBookings} bookings, ${res.seededFarmers} farmers, and ${res.seededCentres} centres into Supabase PostgreSQL!`);
      await fetchBackendData();
    } catch (e) {
      setSupabaseSeedMsg(`❌ Error seeding Supabase: ${e.message}`);
    } finally {
      setSupabaseSeedLoading(false);
    }
  };

  const isOnline = Boolean(healthData && healthData.status === 'ok');

  // Venue load counts from active bookings
  const venueStats = [
    {
      id: 'apmc-main',
      name: 'APMC Mandi Main Yard',
      type: 'Heavy Load Venue',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      count: bookings.filter(b => b.centreId === 'apmc-main').length,
      capacity: 32
    },
    {
      id: 'district-hub',
      name: 'District Procurement Hub',
      type: 'Heavy Load Venue',
      color: '#EA580C',
      bgColor: '#FFF7ED',
      count: bookings.filter(b => b.centreId === 'district-hub').length,
      capacity: 32
    },
    {
      id: 'kvk',
      name: 'Kisan Vikas Kendra',
      type: 'Light Load Venue (Fast-Track)',
      color: '#16A34A',
      bgColor: '#F0FDF4',
      count: bookings.filter(b => b.centreId === 'kvk').length,
      capacity: 32
    },
    {
      id: 'taluka-mandi',
      name: 'Taluka Mandi Centre',
      type: 'Light Load Venue (Fast-Track)',
      color: '#059669',
      bgColor: '#ECFDF5',
      count: bookings.filter(b => b.centreId === 'taluka-mandi').length,
      capacity: 32
    }
  ];

  const endpoints = [
    { method: 'GET', path: '/api/health', desc: 'Backend server & SQLite healthcheck', response: '{ status: "ok", database: "SQLite" }' },
    { method: 'GET', path: '/api/bookings', desc: 'Query all bookings with filters (centre, date, status, search)', response: '{ count: 50, data: [...] }' },
    { method: 'GET', path: '/api/bookings/:sellingId', desc: 'Fetch single procurement slot booking details', response: '{ data: { sellingId, farmerName, ... } }' },
    { method: 'POST', path: '/api/bookings', desc: 'Create new slot booking with queue token and arrival estimate', response: '{ success: true, data: {...} }' },
    { method: 'PUT', path: '/api/bookings/:sellingId/status', desc: 'Advance stage (Booked -> Arrived -> Verified -> Weighed)', response: '{ success: true, data: {...} }' },
    { method: 'POST', path: '/api/bookings/:sellingId/payment', desc: 'Disburse payout (Razorpay DBT or Cash counter voucher)', response: '{ status: "Sale Completed", paymentStatus: "Paid" }' },
    { method: 'POST', path: '/api/farmers/login', desc: 'Authenticate farmer with 10-digit mobile & 11-digit ID card', response: '{ data: { profile, bank } }' },
    { method: 'PUT', path: '/api/farmers/:mobile/profile', desc: 'Update farmer personal details, address & village', response: '{ success: true, data: {...} }' },
    { method: 'PUT', path: '/api/farmers/:mobile/bank', desc: 'Update linked bank account and IFSC code', response: '{ success: true, data: {...} }' },
    { method: 'GET', path: '/api/queues/live', desc: 'Live tokens being served across all 4 Mandi centres', response: '{ "apmc-main_10 Sep...": 1 }' },
    { method: 'POST', path: '/api/queues/advance', desc: 'Advance counter queue token for session', response: '{ currentToken: 2 }' },
    { method: 'GET', path: '/api/admin/stats', desc: 'Aggregated tonnage, payout total, and venue distribution', response: '{ totalBookings: 50, totalTonnage: 41.7 }' },
    { method: 'POST', path: '/api/admin/reset-seed', desc: 'Wipe and reseed database with 50-item dataset', response: '{ message: "Database reset successfully" }' }
  ];

  return (
    <div className="admin-backend-info" style={{ padding: '4px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)'
          }}>
            <Database size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                {isSupabase ? 'Supabase Cloud PostgreSQL & REST Data Layer' : 'Backend API & SQLite Database Engine'}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: isSupabase ? 'rgba(56, 189, 248, 0.2)' : (isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                color: isSupabase ? '#38BDF8' : (isOnline ? '#4ADE80' : '#F87171'),
                border: `1px solid ${isSupabase ? 'rgba(56, 189, 248, 0.4)' : (isOnline ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)')}`
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isSupabase ? '#38BDF8' : (isOnline ? '#4ADE80' : '#F87171'),
                  boxShadow: (isSupabase || isOnline) ? '0 0 8px currentColor' : 'none'
                }}></span>
                {isSupabase ? 'SUPABASE CLOUD POSTGRESQL' : (isOnline ? 'LIVE & PERSISTENT SQLITE' : 'OFFLINE')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              {isSupabase
                ? 'Production cloud PostgreSQL source of truth with Row Level Security & publishable client API'
                : 'High-performance Node.js v25 native node:sqlite database with Express REST API'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchBackendData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>

          <button
            type="button"
            onClick={handleReseed}
            disabled={reseedLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0D9488',
              border: 'none',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Zap size={14} />
            {reseedLoading ? 'Reseeding...' : 'Reset & Seed 50 Dataset'}
          </button>
        </div>
      </div>

      {reseedSuccess && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #6EE7B7',
          color: '#065F46',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          {reseedSuccess}
        </div>
      )}

      {/* 4 System Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px', borderLeft: `4px solid ${isSupabase ? '#0284C7' : '#0D9488'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Database Engine</span>
            <Database size={16} color={isSupabase ? '#0284C7' : '#0D9488'} />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
            {isSupabase ? 'Supabase PostgreSQL' : 'SQLite 3'}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            {isSupabase ? <span>Source: <strong>Cloud PostgreSQL (RLS)</strong></span> : <span>Driver: <strong>native node:sqlite</strong></span>}
          </div>
          <div style={{ fontSize: '11px', color: isSupabase ? '#0284C7' : '#059669', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSupabase ? '#0284C7' : '#059669' }}></span>
            {isSupabase ? 'Supabase Client Connected' : 'WAL Mode (Write-Ahead Logging)'}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{isSupabase ? 'Deployment Host' : 'Server Architecture'}</span>
            <Server size={16} color="#2563EB" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
            {isSupabase ? 'Vercel + Supabase' : 'Node.js + Express'}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            {isSupabase ? <span>Live: <strong>kisanx05.vercel.app</strong></span> : <span>Backend: <strong>Port 5000</strong></span>}
          </div>
          <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '6px' }}>
            {isSupabase ? 'Vite Static SPA + Cloud DB' : 'Vite Proxy: /api -> :5000'}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Total Stored Records</span>
            <Layers size={16} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
            {bookings.length} Bookings
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Completed: <strong>{bookings.filter(b => b.status === 'Sale Completed').length}</strong> | Pending: <strong>{bookings.filter(b => b.status !== 'Sale Completed').length}</strong>
          </div>
          <div style={{ fontSize: '11px', color: '#7C3AED', marginTop: '6px' }}>
            50 Registered Farmers & Bank Accounts
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>API Latency</span>
            <Activity size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
            {healthData?.latency !== undefined ? `${healthData.latency} ms` : '~2 ms'}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Health: <strong>HTTP 200 OK</strong>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
            Checked at {lastCheckTime || 'Just now'}
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'supabase', label: '⚡ Supabase PostgreSQL', icon: Shield },
          { id: 'overview', label: 'Venue Load & Architecture', icon: Cpu },
          { id: 'tables', label: 'Database Tables & Records', icon: Table },
          { id: 'endpoints', label: 'REST API Catalog', icon: Code },
          { id: 'raw', label: 'Live Server Response', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid #0D9488' : '3px solid transparent',
                color: isActive ? '#0D9488' : '#64748B',
                fontWeight: isActive ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 0: SUPABASE POSTGRESQL & CLOUD INTEGRATION */}
      {activeSubTab === 'supabase' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Architecture Card */}
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <Cloud size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    KisanX $\rightarrow$ Supabase PostgreSQL Architecture
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    Zero-Backend Serverless Architecture Deployed on Vercel
                  </div>
                </div>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: isSupabase ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isSupabase ? '#4ADE80' : '#FBBF24',
                border: `1px solid ${isSupabase ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isSupabase ? '#4ADE80' : '#FBBF24',
                  boxShadow: '0 0 8px currentColor'
                }}></span>
                {isSupabase ? 'SUPABASE SOURCE OF TRUTH ACTIVE' : 'AWAITING VERCEL / LOCAL ENV VARS'}
              </span>
            </div>

            {/* Architecture Flow Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700' }}>FRONTEND CLIENT</div>
                <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>kisanx05.vercel.app</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Vite React Single Page App</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '20px', fontWeight: '900' }}>
                $\longrightarrow$
              </div>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700' }}>SUPABASE CLIENT API</div>
                <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>@supabase/supabase-js</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Publishable Anon Key (RLS)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '20px', fontWeight: '900' }}>
                $\longrightarrow$
              </div>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: '#4ADE80', fontWeight: '700' }}>CLOUD DATABASE</div>
                <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>PostgreSQL Database</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Tables, Views & Realtime</div>
              </div>
            </div>
          </div>

          {/* Seed Feedback Message */}
          {supabaseSeedMsg && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '13px',
              backgroundColor: supabaseSeedMsg.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
              color: supabaseSeedMsg.startsWith('✅') ? '#065F46' : '#991B1B',
              border: `1px solid ${supabaseSeedMsg.startsWith('✅') ? '#6EE7B7' : '#FCA5A5'}`
            }}>
              {supabaseSeedMsg}
            </div>
          )}

          {/* Environment Variables & Action Bar */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                  🔑 Supabase Environment Variables
                </h4>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Configure these in Vercel Project Settings $\rightarrow$ Environment Variables
                </div>
              </div>

              {isSupabase && (
                <button
                  type="button"
                  onClick={handleSeedSupabase}
                  disabled={supabaseSeedLoading}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Zap size={15} />
                  {supabaseSeedLoading ? 'Seeding Supabase...' : 'Seed Demo Dataset to Supabase'}
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Current Value / Status</th>
                    <th>Required For</th>
                    <th>Secret Exposure</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0284C7' }}>VITE_SUPABASE_URL</code></td>
                    <td>
                      {import.meta.env.VITE_SUPABASE_URL ? (
                        <span style={{ color: '#059669', fontWeight: '600' }}>
                          ✓ Configured: <code>{import.meta.env.VITE_SUPABASE_URL}</code>
                        </span>
                      ) : (
                        <span style={{ color: '#D97706', fontWeight: '600' }}>
                          ⚠️ Not Configured in current environment
                        </span>
                      )}
                    </td>
                    <td>Connecting frontend client to Supabase cloud instance</td>
                    <td><span style={{ color: '#059669', fontWeight: '600' }}>Safe (Public URL)</span></td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0284C7' }}>VITE_SUPABASE_PUBLISHABLE_KEY</code></td>
                    <td>
                      {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                        <span style={{ color: '#059669', fontWeight: '600' }}>
                          ✓ Configured (Anon Publishable Key)
                        </span>
                      ) : (
                        <span style={{ color: '#D97706', fontWeight: '600' }}>
                          ⚠️ Not Configured in current environment
                        </span>
                      )}
                    </td>
                    <td>Client-side authentication with Row Level Security (RLS)</td>
                    <td><span style={{ color: '#059669', fontWeight: '600' }}>Safe (Anon / Publishable only)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 8 Supabase Tables & Views */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              🗄️ Supabase PostgreSQL Schema (8 Tables & Views)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Table / View</th>
                    <th>Type</th>
                    <th>Demo Records</th>
                    <th>Row Level Security (RLS)</th>
                    <th>Purpose & Source of Truth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0D9488' }}>procurement_centres</code></td>
                    <td>Table</td>
                    <td><strong>4 Centres</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Public Read)</span></td>
                    <td>APMC Mandi Main, District Hub, KVK, Taluka Mandi</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0D9488' }}>sessions</code></td>
                    <td>Table</td>
                    <td><strong>4 Sessions</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Public Read)</span></td>
                    <td>4 Daily 2-hr operational intervals (08 AM - 04 PM)</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#2563EB' }}>farmers</code></td>
                    <td>Table</td>
                    <td><strong>50 Farmers</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Read/Write)</span></td>
                    <td>15 attributes: Mobile, 11-digit ID, village, KYC, bank details</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#7C3AED' }}>bookings</code></td>
                    <td>Table</td>
                    <td><strong>50 Bookings</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Read/Write)</span></td>
                    <td>Mandi selling reservations, tokens, weights, DBT vouchers</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#EA580C' }}>live_queues</code></td>
                    <td>Table</td>
                    <td><strong>4 Queues</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Read/Write)</span></td>
                    <td>Real-time counter token being served per session</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#16A34A' }}>notifications</code></td>
                    <td>Table</td>
                    <td><strong>Dynamic</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>RLS Active (Read/Write)</span></td>
                    <td>SMS / In-app alerts for token arrival and DBT payouts</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#D97706' }}>sales_view</code></td>
                    <td>SQL View</td>
                    <td><strong>Completed Sales</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>Filtered View</span></td>
                    <td>Auto-computed: <code>WHERE status = 'Sale Completed'</code></td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0284C7' }}>payments_view</code></td>
                    <td>SQL View</td>
                    <td><strong>Settled Payments</strong></td>
                    <td><span style={{ color: '#059669', fontWeight: '700' }}>Filtered View</span></td>
                    <td>Auto-computed: <code>WHERE payment_status = 'Paid'</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '14px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
              color: '#475569'
            }}>
              <strong>💡 How to run the SQL Schema:</strong> Open your Supabase project dashboard $\rightarrow$ <strong>SQL Editor</strong> $\rightarrow$ Open file <code>supabase/schema.sql</code> $\rightarrow$ Click <strong>Run</strong>.
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & VENUE LOAD */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Venue Load Breakdown */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  🏟️ Venue Slot Distribution (Current Live Dataset)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Configured with 2 High-Traffic Venues (24 & 20 slots) and 2 Light-Traffic Venues (3 slots each)
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D9488', backgroundColor: '#F0FDFA', padding: '4px 10px', borderRadius: '6px' }}>
                Total: 50 Booked Slots
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {venueStats.map(v => {
                const pct = Math.round((v.count / 32) * 100);
                return (
                  <div key={v.id} style={{
                    border: `1px solid #E2E8F0`,
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: v.bgColor
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A' }}>{v.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: v.color }}>{v.type}</div>
                      </div>
                      <span style={{
                        backgroundColor: v.color,
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '3px 10px',
                        borderRadius: '20px'
                      }}>
                        {v.count} Slots
                      </span>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                        <span>Capacity Utilization</span>
                        <span>{pct}% ({v.count}/32 daily max)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: v.color, borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#475569' }}>
                      {v.count > 10 ? '🔴 High waiting queue — Smart engine recommends diverting farmers.' : '🟢 Zero delay — Immediate slot availability.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database File Details & Engine Specifications */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
              🛠️ Technical Architecture Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>DATABASE FILE LOCATION</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '4px', wordBreak: 'break-all' }}>
                  <code>KisanX/server/kisanx.db</code>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>SQLITE DRIVER</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
                  Node.js v25 Built-in (<code>DatabaseSync</code>)
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>TRANSACTION ISOLATION</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
                  WAL (Write-Ahead Logging) Mode
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>BACKEND PROCESS</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
                  Express.js v5 (Port 5000 Daemon)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE TABLES */}
      {activeSubTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  🗃️ SQLite Schema & Tables
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>5 Relational Tables Active • Direct SQLite File Access</span>
              </div>

              {/* 2 Clicking Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onNavigateToFarmerDb && onNavigateToFarmerDb()}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '7px',
                    fontWeight: '800',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>👨‍🌾</span>
                  <span>Open Farmer Database</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToBookingDb && onNavigateToBookingDb()}
                  style={{
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '7px',
                    fontWeight: '800',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📋</span>
                  <span>Open Booking Database</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Primary Key</th>
                    <th>Record Count</th>
                    <th>Core Fields</th>
                    <th>Storage Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#0D9488' }}>bookings</code></td>
                    <td><code>id (TEXT), sellingId (UNIQUE)</code></td>
                    <td><strong>{bookings.length}</strong></td>
                    <td>crop, quantity, rate, totalAmount, status, centreId, sessionId, tokenNumber</td>
                    <td>Core APMC slot reservations, weighing & payouts</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#2563EB' }}>farmers</code></td>
                    <td><code>mobileNumber (TEXT)</code></td>
                    <td><strong>50</strong></td>
                    <td>fullName, farmerIdCard, village, taluka, district, preferredPaymentMode</td>
                    <td>Farmer profile & KYC registry</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#7C3AED' }}>bank_accounts</code></td>
                    <td><code>id (INTEGER), mobileNumber (UNIQUE)</code></td>
                    <td><strong>50</strong></td>
                    <td>accountHolder, bankName, accountNumber, ifscCode, preferredPaymentMode</td>
                    <td>Bank routing for direct benefit transfer (DBT)</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#EA580C' }}>live_queues</code></td>
                    <td><code>queueKey (TEXT)</code></td>
                    <td><strong>84</strong></td>
                    <td>queueKey, currentToken, updatedAt</td>
                    <td>Counter tokens being served live in real-time</td>
                  </tr>
                  <tr>
                    <td><code style={{ fontWeight: '700', color: '#16A34A' }}>notifications</code></td>
                    <td><code>id (TEXT)</code></td>
                    <td><strong>50+</strong></td>
                    <td>mobileNumber, title, message, date, read, createdAt</td>
                    <td>SMS / in-app notifications for tokens & DBT payouts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Bookings Table View */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
              📋 Recent 10 Bookings in Database
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Selling ID</th>
                    <th>Token</th>
                    <th>Farmer Name</th>
                    <th>Crop</th>
                    <th>Weight</th>
                    <th>Venue</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 10).map(b => (
                    <tr key={b.id || b.sellingId}>
                      <td><code style={{ fontWeight: '700', color: '#0D9488' }}>{b.sellingId}</code></td>
                      <td><span style={{ fontWeight: '700', color: '#1E293B' }}>{b.centreToken}</span></td>
                      <td>{b.farmerName}</td>
                      <td>{b.crop}</td>
                      <td>{b.quantity} kg</td>
                      <td>{b.centre}</td>
                      <td>{b.date}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: b.status === 'Sale Completed' ? '#ECFDF5' : (b.status === 'Crop Verified' ? '#EFF6FF' : '#FEF3C7'),
                          color: b.status === 'Sale Completed' ? '#065F46' : (b.status === 'Crop Verified' ? '#1E40AF' : '#92400E')
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td>{b.paymentStatus || 'Pending'} ({b.paymentMode})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REST API CATALOG */}
      {activeSubTab === 'endpoints' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                📡 Complete REST API Endpoint Catalog
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                Mounted on <code style={{ color: '#0D9488' }}>http://localhost:5000/api</code> and accessible via Vite dev proxy on <code style={{ color: '#0D9488' }}>http://localhost:5173/api</code>
              </p>
            </div>
            <a
              href="http://localhost:5000/api/health"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#2563EB',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13px'
              }}
            >
              Open Healthcheck <ExternalLink size={14} />
            </a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Method</th>
                  <th>Endpoint</th>
                  <th>Description</th>
                  <th>Sample Output</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        backgroundColor: ep.method === 'GET' ? '#0284C7' : (ep.method === 'POST' ? '#16A34A' : '#D97706')
                      }}>
                        {ep.method}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontWeight: '700', color: '#0F172A' }}>{ep.path}</code>
                    </td>
                    <td>{ep.desc}</td>
                    <td>
                      <code style={{ fontSize: '11px', color: '#64748B' }}>{ep.response}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RAW HEALTH & STATS RESPONSE */}
      {activeSubTab === 'raw' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
              <code>GET /api/health</code> (Live Output)
            </h4>
            <pre style={{
              backgroundColor: '#0F172A',
              color: '#38BDF8',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto'
            }}>
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
              <code>GET /api/admin/stats</code> (Live Output)
            </h4>
            <pre style={{
              backgroundColor: '#0F172A',
              color: '#4ADE80',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto'
            }}>
              {JSON.stringify(adminStats, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackendInfo;
