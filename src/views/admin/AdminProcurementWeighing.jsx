import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Scale,
  Search,
  Filter,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Building,
  User,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePortalData } from '../../context/PortalDataContext';
import BookingSlipModal from '../../components/BookingSlipModal';

const LIFECYCLE_STAGES = [
  'Booked',
  'Arrived',
  'Crop Verified',
  'Weighed',
  'Sale Completed'
];

export const AdminProcurementWeighing = ({ onSelectBooking, initialSellingId = '', onNavigateToPayment }) => {
  const { t } = useLanguage();
  const { bookings, updateBookingStatus, findBookingBySellingId } = usePortalData();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSellingId || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [centreFilter, setCentreFilter] = useState('ALL');
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Weighing input state
  const [weighedWeight, setWeighedWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('0');
  const [qualityGrade, setQualityGrade] = useState('FAQ (Grade A)');
  const [moistureContent, setMoistureContent] = useState('11.5%');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync if initialSellingId changes or on load
  useEffect(() => {
    if (initialSellingId) {
      const found = findBookingBySellingId(initialSellingId);
      if (found) {
        handleSelectRow(found);
      }
    } else if (!selectedBooking && bookings.length > 0) {
      // Pre-select first arriving or weighed booking for immediate demonstration
      const readyItem = bookings.find(b => b.status === 'Arrived' || b.status === 'Crop Verified') || bookings[0];
      if (readyItem) {
        handleSelectRow(readyItem);
      }
    }
  }, [initialSellingId, bookings]);

  const handleSelectRow = (booking) => {
    setSelectedBooking(booking);
    setWeighedWeight(String(booking.finalQuantity || booking.quantity || 100));
    setSaveSuccessNotice(false);
  };

  // Advance stage
  const handleAdvanceStatus = (nextStatus) => {
    if (!selectedBooking) return;
    const targetStatus = nextStatus || getNextStage(selectedBooking.status);
    if (!targetStatus) return;

    updateBookingStatus(selectedBooking.sellingId, targetStatus);
    setSelectedBooking(prev => ({ ...prev, status: targetStatus }));
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const getNextStage = (currStatus) => {
    const idx = LIFECYCLE_STAGES.indexOf(currStatus);
    if (idx >= 0 && idx < LIFECYCLE_STAGES.length - 1) {
      return LIFECYCLE_STAGES[idx + 1];
    }
    return null;
  };

  // Save weighbridge reading
  const handleSaveWeighment = (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const netWeight = Math.max(0, Number(weighedWeight) || 0);
    // Auto-advance to 'Weighed' if currently arrived or verified
    const nextStatus = (selectedBooking.status === 'Booked' || selectedBooking.status === 'Arrived' || selectedBooking.status === 'Crop Verified')
      ? 'Weighed'
      : selectedBooking.status;

    updateBookingStatus(selectedBooking.sellingId, nextStatus);
    setSelectedBooking(prev => ({
      ...prev,
      finalQuantity: netWeight,
      status: nextStatus
    }));

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Filtered list
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      b.sellingId.toLowerCase().includes(q) ||
      (b.centreToken && b.centreToken.toLowerCase().includes(q)) ||
      (b.farmerName && b.farmerName.toLowerCase().includes(q)) ||
      (b.crop && b.crop.toLowerCase().includes(q)) ||
      (b.mobileNumber && b.mobileNumber.includes(q));

    const matchesCentre = centreFilter === 'ALL' || b.centreId === centreFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesCentre && matchesStatus;
  });

  // Metrics
  const arrivedCount = bookings.filter(b => b.status === 'Arrived' || b.status === 'Crop Verified').length;
  const weighedCount = bookings.filter(b => b.status === 'Weighed').length;
  const completedCount = bookings.filter(b => b.status === 'Sale Completed').length;
  const totalTonnageKg = bookings.reduce((sum, b) => sum + (b.finalQuantity || b.quantity || 0), 0);

  return (
    <div className="admin-procurement-weighing">
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>
              Procurement & Physical Weighbridge
            </h1>
            <p className="subtitle" style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              Verify crop quality standards, enter weighbridge readings, and advance mandi batches
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #EA580C' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Awaiting Weighment
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            {arrivedCount} Batches
          </div>
          <div style={{ fontSize: '11px', color: '#EA580C', marginTop: '4px', fontWeight: '600' }}>
            Arrived & Crop Verified at gates
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Weighed & Ready for Payout
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            {weighedCount} Batches
          </div>
          <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '4px', fontWeight: '600' }}>
            Certified gross weighbridge slip generated
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            Total Procurement Volume
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            {(totalTonnageKg / 1000).toFixed(1)} MT
          </div>
          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>
            {totalTonnageKg.toLocaleString('en-IN')} kg across 4 Mandi centres
          </div>
        </div>
      </div>

      {/* Main Grid: Left side Table & Right side Weighing Station */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedBooking ? '1.2fr 1fr' : '1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Side: Active Batches Table */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
              📋 Procurement Batches & Weighbridge Queue ({filteredBookings.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Click any row to process weighment
            </span>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, Token, Farmer, Crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="ALL">All Stages</option>
              <option value="Booked">Booked</option>
              <option value="Arrived">Arrived at Gate</option>
              <option value="Crop Verified">Crop Verified</option>
              <option value="Weighed">Weighed</option>
              <option value="Sale Completed">Sale Completed</option>
            </select>

            <select
              className="form-select"
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="ALL">All Centres</option>
              <option value="apmc-main">APMC Main</option>
              <option value="district-hub">District Hub</option>
              <option value="kvk">KVK</option>
              <option value="taluka-mandi">Taluka Mandi</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>Token & ID</th>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                      No matching procurement batches found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => {
                    const isSelected = selectedBooking?.sellingId === b.sellingId;
                    return (
                      <tr
                        key={b.sellingId}
                        onClick={() => handleSelectRow(b)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>{b.centreToken || 'TK-01'}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>{b.sellingId}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#1E293B' }}>{b.farmerName}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{b.mobileNumber}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0D9488' }}>{b.crop}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{b.variety || 'Standard'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>
                            {b.finalQuantity || b.quantity} {b.unit || 'kg'}
                          </div>
                          {b.finalQuantity && b.finalQuantity !== b.quantity && (
                            <div style={{ fontSize: '10.5px', color: '#059669' }}>
                              Weighed: {b.finalQuantity} kg
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor:
                              b.status === 'Sale Completed' ? '#DCFCE7' :
                              b.status === 'Weighed' ? '#DBEAFE' :
                              b.status === 'Crop Verified' ? '#FEF3C7' :
                              b.status === 'Arrived' ? '#FFEDD5' : '#F1F5F9',
                            color:
                              b.status === 'Sale Completed' ? '#166534' :
                              b.status === 'Weighed' ? '#1E40AF' :
                              b.status === 'Crop Verified' ? '#92400E' :
                              b.status === 'Arrived' ? '#9A3412' : '#475569'
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(b);
                            }}
                            style={{
                              backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#1E293B',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Scale size={13} />
                            <span>{isSelected ? 'Active' : 'Weigh'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Active Weighbridge & Verification Console */}
        {selectedBooking && (
          <div className="card" style={{ padding: '20px', borderTop: '4px solid #D97706', position: 'sticky', top: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ACTIVE WEIGHBRIDGE DESK
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  {selectedBooking.crop} ({selectedBooking.centreToken})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Selling ID: <strong style={{ fontFamily: 'monospace' }}>{selectedBooking.sellingId}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-blue btn-small"
                onClick={() => setShowSlipModal(true)}
                style={{ fontSize: '12px' }}
              >
                <FileText size={14} />
                Booking Slip
              </button>
            </div>

            {/* Farmer Snapshot Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Farmer: </span>
                  <strong style={{ color: '#0F172A' }}>{selectedBooking.farmerName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Mobile: </span>
                  <strong>{selectedBooking.mobileNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Mandi Centre: </span>
                  <strong>{selectedBooking.centre}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Village: </span>
                  <strong>{selectedBooking.village || 'Amreli'}</strong>
                </div>
              </div>
            </div>

            {/* Progress Lifecycle Stepper */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                Procurement Lifecycle Progression:
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {LIFECYCLE_STAGES.map((stage, i) => {
                  const currentIdx = LIFECYCLE_STAGES.indexOf(selectedBooking.status);
                  const isDone = i <= currentIdx;
                  return (
                    <div
                      key={stage}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: isDone ? '#0D9488' : '#F1F5F9',
                        color: isDone ? '#FFFFFF' : '#64748B'
                      }}
                    >
                      {stage}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weighbridge Input Form */}
            <form onSubmit={handleSaveWeighment}>
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Scale size={18} color="#D97706" />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#92400E' }}>
                    Certified Weighbridge Scale Input
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Declared Qty
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={`${selectedBooking.quantity} kg`}
                      disabled
                      style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#B45309' }}>
                      Gross Weight Reading (kg) *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={weighedWeight}
                      onChange={(e) => setWeighedWeight(e.target.value)}
                      required
                      style={{
                        fontWeight: '800',
                        fontSize: '16px',
                        borderColor: '#F59E0B',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Fair Average Quality (FAQ) Grade
                    </label>
                    <select
                      className="form-select"
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      style={{ fontSize: '12.5px' }}
                    >
                      <option value="FAQ (Grade A)">FAQ (Grade A - Full MSP)</option>
                      <option value="Grade B">Grade B (Standard)</option>
                      <option value="Grade C">Grade C (Slight Moisture)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Moisture Content Meter
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={moistureContent}
                      onChange={(e) => setMoistureContent(e.target.value)}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                </div>
              </div>

              {saveSuccessNotice && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={16} />
                  Weighment certified and status advanced successfully!
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-blue"
                  style={{
                    backgroundColor: '#D97706',
                    borderColor: '#B45309',
                    fontSize: '14px',
                    fontWeight: '800',
                    padding: '10px'
                  }}
                >
                  <Scale size={16} />
                  <span>Save Physical Weighment & Certify (Weighed)</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus()}
                    disabled={selectedBooking.status === 'Sale Completed'}
                    className="btn btn-secondary btn-small"
                    style={{ fontWeight: '700', fontSize: '12px' }}
                  >
                    <ArrowRight size={14} />
                    Advance Stage ({getNextStage(selectedBooking.status) || 'Done'})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToPayment) {
                        onNavigateToPayment(selectedBooking.sellingId);
                      }
                    }}
                    className="btn btn-outline-blue btn-small"
                    style={{ fontWeight: '700', fontSize: '12px', borderColor: '#7C3AED', color: '#7C3AED' }}
                  >
                    💳 Go to Payment Payout
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {showSlipModal && selectedBooking && (
        <BookingSlipModal
          booking={selectedBooking}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};

export default AdminProcurementWeighing;
