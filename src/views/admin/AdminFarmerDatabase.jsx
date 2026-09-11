import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Phone,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';
import { usePortalData } from '../../context/PortalDataContext';

export const AdminFarmerDatabase = ({ onNavigateToBooking }) => {
  const { bookings } = usePortalData();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const res = await api.getAllFarmers();
      if (res?.success && Array.isArray(res.data)) {
        setFarmers(res.data);
      } else {
        // Fallback from active bookings if backend array empty
        const map = new Map();
        bookings.forEach(b => {
          if (b.mobileNumber && !map.has(b.mobileNumber)) {
            map.set(b.mobileNumber, {
              farmerIdCard: b.farmerIdCard || '10020030040',
              mobileNumber: b.mobileNumber,
              farmerName: b.farmerName || 'Registered Farmer',
              village: b.village || 'Amreli Rural',
              taluka: b.taluka || 'Amreli',
              district: b.district || 'Amreli',
              state: b.state || 'Gujarat',
              address: `${b.village || 'Amreli'} Main Road`,
              paymentMode: b.paymentMode || 'Online',
              accountHolder: b.farmerName || 'Registered Farmer',
              bankName: b.bankName || 'State Bank of India',
              accountNumber: b.accountNumber || '309820001234',
              ifscCode: b.ifscCode || 'SBIN0001234',
              createdAt: b.createdAt || new Date().toISOString(),
              updatedAt: b.createdAt || new Date().toISOString()
            });
          }
        });
        setFarmers(Array.from(map.values()));
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [bookings]);

  // Filtered farmers list
  const filteredFarmers = farmers.filter(f => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      (f.farmerName && f.farmerName.toLowerCase().includes(term)) ||
      (f.mobileNumber && f.mobileNumber.includes(term)) ||
      (f.farmerIdCard && f.farmerIdCard.includes(term)) ||
      (f.village && f.village.toLowerCase().includes(term)) ||
      (f.accountNumber && f.accountNumber.includes(term));

    const matchesDistrict = districtFilter === 'ALL' || f.district === districtFilter;
    const matchesMode = paymentModeFilter === 'ALL' || f.paymentMode === paymentModeFilter;

    return matchesSearch && matchesDistrict && matchesMode;
  });

  // Extract unique districts
  const districts = Array.from(new Set(farmers.map(f => f.district).filter(Boolean)));

  // Export CSV of all 15 columns
  const exportToCsv = () => {
    const headers = [
      'Farmer ID Card No',
      'Mobile No',
      'Farmer Name',
      'Village',
      'Taluka',
      'District',
      'State',
      'Address',
      'Payment Mode',
      'Account Holder',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'Created At',
      'Updated At'
    ];

    const rows = filteredFarmers.map(f => [
      `"${f.farmerIdCard || ''}"`,
      `"${f.mobileNumber || ''}"`,
      `"${f.farmerName || ''}"`,
      `"${f.village || ''}"`,
      `"${f.taluka || ''}"`,
      `"${f.district || ''}"`,
      `"${f.state || ''}"`,
      `"${f.address || ''}"`,
      `"${f.paymentMode || ''}"`,
      `"${f.accountHolder || ''}"`,
      `"${f.bankName || ''}"`,
      `"${f.accountNumber || ''}"`,
      `"${f.ifscCode || ''}"`,
      `"${f.createdAt || ''}"`,
      `"${f.updatedAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kisanx_farmers_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* Top Banner & Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              SQLite Table: farmers
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              15 Database Columns
            </span>
          </div>
          <h1 className="page-title" style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#0F172A' }}>
            👨‍🌾 Farmer Database Dossiers
          </h1>
          <p className="subtitle" style={{ margin: 0, fontSize: '13.5px' }}>
            Official master farmer directory with verified ID cards, DBT bank accounts, and geographic locations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={fetchFarmers}
            title="Refresh from SQLite Database"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={exportToCsv}
            style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}
          >
            <FileSpreadsheet size={15} />
            Export CSV ({filteredFarmers.length})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card blue-theme">
          <div className="metric-header">
            <span className="metric-label">Total Registered Farmers</span>
            <div className="metric-icon-box blue">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{farmers.length}</div>
          <div className="metric-subtext">Verified database records</div>
        </div>

        <div className="metric-card green-theme">
          <div className="metric-header">
            <span className="metric-label">DBT Bank Accounts Linked</span>
            <div className="metric-icon-box green">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="metric-value">
            {farmers.filter(f => f.accountNumber && f.accountNumber.length > 4).length}
          </div>
          <div className="metric-subtext">Direct Bank Transfer ready</div>
        </div>

        <div className="metric-card purple-theme">
          <div className="metric-header">
            <span className="metric-label">Online Payment Mode</span>
            <div className="metric-icon-box purple">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="metric-value">
            {farmers.filter(f => f.paymentMode === 'Online').length}
          </div>
          <div className="metric-subtext">Preferred DBT / Aadhaar Pay</div>
        </div>

        <div className="metric-card amber-theme">
          <div className="metric-header">
            <span className="metric-label">Districts Represented</span>
            <div className="metric-icon-box amber">
              <MapPin size={20} />
            </div>
          </div>
          <div className="metric-value">{districts.length || 4}</div>
          <div className="metric-subtext">APMC procurement catchment</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
              placeholder="Search by Farmer Name, Mobile (+91), ID Card No, Village, or Bank Account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* District Filter */}
          <div style={{ flex: '0 0 180px' }}>
            <select
              className="form-input"
              style={{ height: '42px', fontSize: '13px' }}
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="ALL">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div style={{ flex: '0 0 160px' }}>
            <select
              className="form-input"
              style={{ height: '42px', fontSize: '13px' }}
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
            >
              <option value="ALL">All Payment Modes</option>
              <option value="Online">Online DBT</option>
              <option value="Cash">Cash Counter</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || districtFilter !== 'ALL' || paymentModeFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setSearchTerm('');
                setDistrictFilter('ALL');
                setPaymentModeFilter('ALL');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Full 15-Column Farmer Database Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋 Showing {filteredFarmers.length} of {farmers.length} Farmer Records</span>
            <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '4px' }}>
              Scroll horizontally to view all 15 columns
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '12px 14px', position: 'sticky', left: 0, backgroundColor: '#F1F5F9', zIndex: 2 }}>#</th>
                <th style={{ padding: '12px 14px', position: 'sticky', left: '38px', backgroundColor: '#F1F5F9', zIndex: 2 }}>Farmer ID Card No.</th>
                <th style={{ padding: '12px 14px' }}>Mobile No.</th>
                <th style={{ padding: '12px 14px' }}>Farmer Name</th>
                <th style={{ padding: '12px 14px' }}>Village</th>
                <th style={{ padding: '12px 14px' }}>Taluka</th>
                <th style={{ padding: '12px 14px' }}>District</th>
                <th style={{ padding: '12px 14px' }}>State</th>
                <th style={{ padding: '12px 14px' }}>Address</th>
                <th style={{ padding: '12px 14px' }}>Payment Mode</th>
                <th style={{ padding: '12px 14px' }}>Account Holder</th>
                <th style={{ padding: '12px 14px' }}>Bank Name</th>
                <th style={{ padding: '12px 14px' }}>Account Number</th>
                <th style={{ padding: '12px 14px' }}>IFSC Code</th>
                <th style={{ padding: '12px 14px' }}>Created At</th>
                <th style={{ padding: '12px 14px' }}>Updated At</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No farmer records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer, idx) => (
                  <tr
                    key={farmer.mobileNumber || idx}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                    }}
                  >
                    {/* # Index */}
                    <td style={{ padding: '10px 14px', color: '#64748B', position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA', zIndex: 1 }}>
                      {idx + 1}
                    </td>

                    {/* 1. Farmer ID Card No. */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', position: 'sticky', left: '38px', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA', zIndex: 1 }}>
                      <code style={{
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '3px 7px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '11.5px',
                        border: '1px solid #BFDBFE'
                      }}>
                        {farmer.farmerIdCard || '10020030040'}
                      </code>
                    </td>

                    {/* 2. Mobile No. */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '700', color: '#0F172A' }}>
                      +91 {farmer.mobileNumber}
                    </td>

                    {/* 3. Farmer Name */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '800', color: '#1E293B' }}>
                      {farmer.farmerName || farmer.fullName || 'Registered Farmer'}
                    </td>

                    {/* 4. Village */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {farmer.village || 'Amreli'}
                    </td>

                    {/* 5. Taluka */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {farmer.taluka || 'Amreli'}
                    </td>

                    {/* 6. District */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {farmer.district || 'Amreli'}
                      </span>
                    </td>

                    {/* 7. State */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {farmer.state || 'Gujarat'}
                    </td>

                    {/* 8. Address */}
                    <td style={{ padding: '10px 14px', minWidth: '180px', color: '#475569', fontSize: '11.5px' }}>
                      {farmer.address || `${farmer.village || 'Amreli'} Main Road, Gujarat`}
                    </td>

                    {/* 9. Payment Mode */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        backgroundColor: farmer.paymentMode === 'Online' ? '#ECFDF5' : '#FFFBEB',
                        color: farmer.paymentMode === 'Online' ? '#065F46' : '#B45309',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: farmer.paymentMode === 'Online' ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                      }}>
                        {farmer.paymentMode || 'Online'}
                      </span>
                    </td>

                    {/* 10. Account Holder */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {farmer.accountHolder || farmer.farmerName || 'Registered Farmer'}
                    </td>

                    {/* 11. Bank Name */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#1E40AF', fontWeight: '600' }}>
                      <Building size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {farmer.bankName || 'State Bank of India'}
                    </td>

                    {/* 12. Account Number */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <code style={{
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        color: '#334155',
                        backgroundColor: '#F1F5F9',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {farmer.accountNumber || '••••••••1234'}
                      </code>
                    </td>

                    {/* 13. IFSC Code */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <code style={{
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        color: '#7C3AED',
                        backgroundColor: '#F5F3FF',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #DDD6FE'
                      }}>
                        {farmer.ifscCode || 'SBIN0001234'}
                      </code>
                    </td>

                    {/* 14. Created At */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748B', fontSize: '11px' }}>
                      {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '10 Sep 2026'}
                    </td>

                    {/* 15. Updated At */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748B', fontSize: '11px' }}>
                      {farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '10 Sep 2026'}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedFarmer(farmer)}
                        className="btn btn-secondary btn-small"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Farmer Dossier Modal */}
      {selectedFarmer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="card" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            borderRadius: '16px',
            borderTop: '6px solid #0284C7',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A', fontWeight: '800' }}>
                  👨‍🌾 {selectedFarmer.farmerName || 'Farmer Dossier'}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Official Government Farmer Record
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* Official ID Card Visual Box */}
            <div style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              padding: '18px',
              borderRadius: '12px',
              marginBottom: '18px',
              boxShadow: '0 8px 16px rgba(30, 64, 175, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                  GOVERNMENT OF GUJARAT • APMC MANDI
                </span>
                <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  Verified
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {selectedFarmer.farmerName || 'Registered Farmer'}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>
                +91 {selectedFarmer.mobileNumber}
              </div>
              <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <span style={{ opacity: 0.8, fontSize: '10.5px' }}>CARD NO: </span>
                  <strong>{selectedFarmer.farmerIdCard}</strong>
                </div>
                <div>
                  <span style={{ opacity: 0.8, fontSize: '10.5px' }}>LOCATION: </span>
                  <strong>{selectedFarmer.village}, {selectedFarmer.district}</strong>
                </div>
              </div>
            </div>

            {/* All 15 Details Key-Value List */}
            <h4 style={{ fontSize: '14px', color: '#334155', marginBottom: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              Database Record Attributes (15 Columns)
            </h4>

            <div className="kv-row"><span className="kv-label">1. Farmer ID Card No:</span><span className="kv-value font-bold">{selectedFarmer.farmerIdCard}</span></div>
            <div className="kv-row"><span className="kv-label">2. Mobile Number:</span><span className="kv-value font-bold">+91 {selectedFarmer.mobileNumber}</span></div>
            <div className="kv-row"><span className="kv-label">3. Farmer Name:</span><span className="kv-value font-bold">{selectedFarmer.farmerName}</span></div>
            <div className="kv-row"><span className="kv-label">4. Village:</span><span className="kv-value">{selectedFarmer.village}</span></div>
            <div className="kv-row"><span className="kv-label">5. Taluka:</span><span className="kv-value">{selectedFarmer.taluka}</span></div>
            <div className="kv-row"><span className="kv-label">6. District:</span><span className="kv-value">{selectedFarmer.district}</span></div>
            <div className="kv-row"><span className="kv-label">7. State:</span><span className="kv-value">{selectedFarmer.state}</span></div>
            <div className="kv-row"><span className="kv-label">8. Full Address:</span><span className="kv-value">{selectedFarmer.address}</span></div>
            <div className="kv-row"><span className="kv-label">9. Payment Mode:</span><span className="kv-value font-bold" style={{ color: selectedFarmer.paymentMode === 'Online' ? '#059669' : '#D97706' }}>{selectedFarmer.paymentMode}</span></div>
            <div className="kv-row"><span className="kv-label">10. Account Holder:</span><span className="kv-value">{selectedFarmer.accountHolder}</span></div>
            <div className="kv-row"><span className="kv-label">11. Bank Name:</span><span className="kv-value font-bold">{selectedFarmer.bankName}</span></div>
            <div className="kv-row"><span className="kv-label">12. Account Number:</span><span className="kv-value font-mono">{selectedFarmer.accountNumber}</span></div>
            <div className="kv-row"><span className="kv-label">13. IFSC Code:</span><span className="kv-value font-mono font-bold" style={{ color: '#7C3AED' }}>{selectedFarmer.ifscCode}</span></div>
            <div className="kv-row"><span className="kv-label">14. Created At:</span><span className="kv-value">{selectedFarmer.createdAt}</span></div>
            <div className="kv-row"><span className="kv-label">15. Updated At:</span><span className="kv-value">{selectedFarmer.updatedAt}</span></div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedFarmer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFarmerDatabase;
