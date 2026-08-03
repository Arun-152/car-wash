import React, { useState, useEffect, useCallback } from 'react';
import {
  getAvailability,
  updateAvailability,
  getShopSettings,
  updateShopSettings as apiUpdateShopSettings,
  getAdminDailySlots,
  blockAdminSlot,
  editAdminSlotCapacity,
  removeAdminSlotOverride,
  createAdminManualBooking,
  getServices,
} from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { Trash2, Plus, ChevronLeft, ChevronRight, Pencil, Check, X, Lock, Unlock } from 'lucide-react';
import './AdminAvailabilityPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const REASONS = ['Holiday', 'Maintenance', 'Shop Closed', 'Other'];

const to12h = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

const toDateStr = (d) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

/** Normalize a blockedDate entry from Mongo (handles old Date and new {date,reason}) */
const normalizeBlockedDate = (bd) => {
  if (bd && typeof bd === 'object' && (bd.date || bd._id)) {
    const d = new Date(bd.date);
    return {
      _id: bd._id,
      date: toDateStr(d),
      reason: bd.reason || '',
    };
  }
  const d = new Date(bd);
  return { date: toDateStr(d), reason: '' };
};

// ── Component ────────────────────────────────────────────────────────────────

const AdminAvailabilityPage = () => {
  // ── Core availability state ──────────────────────────────────

  // ── UI loading / saving / messages ─────────────────────────
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState({}); // {section: {type, text}}



  // ── Daily slot viewer ───────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyErr, setDailyErr] = useState('');

  // ── Slot action state ───────────────────────────────────────
  const [slotAction, setSlotAction] = useState(null); // {type:'edit-cap'|'manual-booking'|null, slot}
  const [newCapacity, setNewCapacity] = useState('');
  const [slotActionLoading, setSlotActionLoading] = useState(false);
  const [showManualBookingConfirm, setShowManualBookingConfirm] = useState(false);
  const [services, setServices] = useState([]);
  const [manualBookingForm, setManualBookingForm] = useState({
    customerName: '',
    mobileNumber: '',
    vehicleNumber: '',
    vehicleType: 'Sedan',
    serviceId: '',
    notes: '',
  });

  // ── Load initial data ─────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const [avData, servicesData] = await Promise.all([getAvailability(), getServices()]);
        setServices(servicesData || []);
        if (servicesData?.length > 0) {
          setManualBookingForm(prev => ({ ...prev, serviceId: servicesData[0]._id }));
        }
      } catch (e) {
        setMsgs((m) => ({ ...m, schedule: { type: 'error', text: 'Failed to load availability data.' } }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Daily slot loader ─────────────────────────────────────────────────────

  const [page, setPage] = useState(1);

  const loadDailySlots = useCallback(async (date, currentPage = page) => {
    setDailyLoading(true);
    setDailyErr('');
    setDailyData(null);
    try {
      const data = await getAdminDailySlots({ date: toDateStr(date), page: currentPage, limit: 5 });
      setDailyData(data);
    } catch (e) {
      setDailyErr(e.response?.data?.message || 'Failed to load daily slots.');
    } finally {
      setDailyLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDailySlots(viewDate, page);
  }, [viewDate, page, loadDailySlots]);

  const clearMsg = (section) =>
    setMsgs((m) => { const n = { ...m }; delete n[section]; return n; });
  // ── Section 4: Slot actions ───────────────────────────────────────────────

  const dateStrForView = toDateStr(viewDate);

  const handleBlockSlot = async (slot) => {
    setSlotActionLoading(true);
    try {
      const result = await blockAdminSlot({
        date: dateStrForView,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      if (result.warning) alert(result.warning);
      await loadDailySlots(viewDate);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to block slot.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  const handleUnblockSlot = async (slot) => {
    if (!slot.overrideId) return;
    setSlotActionLoading(true);
    try {
      await removeAdminSlotOverride(slot.overrideId);
      await loadDailySlots(viewDate);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to unblock slot.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  const handleSaveCapacity = async (slot) => {
    const cap = parseInt(newCapacity);
    if (!cap || cap < 1) return alert('Capacity must be at least 1.');
    setSlotActionLoading(true);
    try {
      await editAdminSlotCapacity({
        date: dateStrForView,
        startTime: slot.startTime,
        endTime: slot.endTime,
        customCapacity: cap,
      });
      setSlotAction(null);
      setNewCapacity('');
      await loadDailySlots(viewDate);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update capacity.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  const handleResetCapacity = async (slot) => {
    if (!slot.overrideId) return;
    setSlotActionLoading(true);
    try {
      await removeAdminSlotOverride(slot.overrideId);
      await loadDailySlots(viewDate);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reset capacity.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  useEffect(() => {
    if (slotAction?.type === 'manual-booking') {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setSlotAction(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [slotAction]);

  const handleSaveManualBookingClick = () => {
    if (!manualBookingForm.customerName || !manualBookingForm.mobileNumber || !manualBookingForm.vehicleNumber || !manualBookingForm.serviceId) {
      return toast.error('Please fill all required fields');
    }
    setShowManualBookingConfirm(true);
  };

  const handleSaveManualBooking = async () => {
    setShowManualBookingConfirm(false);
    setSlotActionLoading(true);
    try {
      const payload = {
        ...manualBookingForm,
        bookingDate: toDateStr(viewDate),
        startTime: slotAction.slot.startTime,
        endTime: slotAction.slot.endTime,
      };
      await createAdminManualBooking(payload);
      toast.success('Manual booking created successfully.');
      setSlotAction(null);
      setManualBookingForm({
        customerName: '',
        mobileNumber: '',
        vehicleNumber: '',
        vehicleType: 'Sedan',
        serviceId: services.length > 0 ? services[0]._id : '',
        notes: '',
      });
      await loadDailySlots(viewDate);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create manual booking');
    } finally {
      setSlotActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="admin-page av-loading">
        <div className="av-spinner" />
        <p>Loading availability settings…</p>
      </div>
    );

  const viewDateDisplay = viewDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="admin-page">
      {/* ── Page header ── */}
      <div className="admin-page-header">
        <h2>Shop Availability</h2>
        <p>Configure working hours, breaks, holidays and manage individual slot capacity.</p>
      </div>





      {/* ════════════════════════════════════════════════════════
          SECTION 4 — DAILY SLOT VIEWER
      ════════════════════════════════════════════════════════ */}
      <div className="av-section">
        <div className="av-section__header">
          <h3>Daily Slot Availability</h3>
          <p>View and manage individual time slots. Block or adjust capacity for specific dates.</p>
        </div>

        {/* Date navigator */}
        <div className="av-date-nav">
          <button
            className="av-nav-btn"
            onClick={() => {
              const d = new Date(viewDate);
              d.setDate(d.getDate() - 1);
              setViewDate(d);
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="av-nav-date">
            <span>{viewDateDisplay}</span>
            {dailyData && !dailyData.isWorkingDay && (
              <span className="av-day-badge av-day-badge--closed">Closed</span>
            )}
            {dailyData?.isBlockedDate && (
              <span className="av-day-badge av-day-badge--blocked">Holiday/Blocked</span>
            )}
          </div>
          <button
            className="av-nav-btn"
            onClick={() => {
              const d = new Date(viewDate);
              d.setDate(d.getDate() + 1);
              setViewDate(d);
            }}
          >
            <ChevronRight size={18} />
          </button>
          <input
            type="date"
            className="av-input av-input--date-jump"
            value={toDateStr(viewDate)}
            onChange={(e) => { if (e.target.value) setViewDate(new Date(e.target.value + 'T12:00:00')); }}
            title="Jump to date"
          />
        </div>

        {/* Daily content */}
        {dailyLoading ? (
          <div className="av-daily-loading">
            <div className="av-spinner av-spinner--sm" />
            <span>Loading slots…</span>
          </div>
        ) : dailyErr ? (
          <div className="av-alert av-alert--error">{dailyErr}</div>
        ) : dailyData ? (
          <>
            {/* Closed / Blocked day banner */}
            {(!dailyData.isWorkingDay || dailyData.isBlockedDate) && (
              <div className="av-alert av-alert--warning">
                {dailyData.isBlockedDate
                  ? 'This date is blocked. Customers cannot book on this day.'
                  : `${dailyData.dayName} is not a working day. No slots are available.`}
              </div>
            )}

            {/* Summary cards */}
            <div className="av-summary-grid">
              <div className="av-summary-card">
                <span className="av-summary-label">Total Slots</span>
                <span className="av-summary-value">{dailyData.summary.totalSlots}</span>
              </div>
              <div className="av-summary-card av-summary-card--green">
                <span className="av-summary-label">Available Cap.</span>
                <span className="av-summary-value">{dailyData.summary.availableCapacity}</span>
              </div>
              <div className="av-summary-card av-summary-card--blue">
                <span className="av-summary-label">Booked</span>
                <span className="av-summary-value">{dailyData.summary.booked}</span>
              </div>
              <div className="av-summary-card av-summary-card--red">
                <span className="av-summary-label">Full Slots</span>
                <span className="av-summary-value">{dailyData.summary.full}</span>
              </div>
              <div className="av-summary-card av-summary-card--orange">
                <span className="av-summary-label">Blocked</span>
                <span className="av-summary-value">{dailyData.summary.blocked}</span>
              </div>
            </div>

            {/* Slot table */}
            {dailyData.slots.length > 0 ? (
              <div className="av-table-wrapper">
                <table className="av-table av-slot-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Capacity</th>
                      <th>Booked</th>
                      <th>Available</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.slots.map((slot, i) => (
                      <tr key={i} className={slot.status === 'break' ? 'av-row--break' : ''}>
                        <td className="av-slot-time">
                          {to12h(slot.startTime)}
                          <span className="av-slot-end"> – {to12h(slot.endTime)}</span>
                        </td>

                        <td>
                          {slot.status === 'break' ? '—' : (
                            <span>
                              {slot.capacity}
                              {slot.isCapacityModified && (
                                <span className="av-modified-badge" title="Custom capacity">*</span>
                              )}
                            </span>
                          )}
                        </td>

                        <td>{slot.status === 'break' ? '—' : slot.booked}</td>

                        <td>{slot.status === 'break' ? '—' : slot.available}</td>

                        <td>
                          <span className={`av-badge av-badge--${slot.status}`}>
                            {slot.status === 'break' ? 'Break'
                              : slot.status === 'blocked' ? 'Blocked'
                                : slot.status === 'full' ? 'Full'
                                  : 'Available'}
                          </span>
                        </td>

                        <td>
                          {slot.status === 'break' ? (
                            <span className="av-no-action">—</span>
                          ) : slot.status === 'blocked' ? (
                            <button
                              className="av-action-btn av-action-btn--unblock"
                              onClick={() => handleUnblockSlot(slot)}
                              disabled={slotActionLoading}
                            >
                              <Unlock size={13} /> Unblock
                            </button>
                          ) : (
                            <div className="av-action-group">
                              {/* Block */}
                              <button
                                className="av-action-btn av-action-btn--block"
                                onClick={() => handleBlockSlot(slot)}
                                disabled={slotActionLoading}
                                title="Block this slot"
                              >
                                <Lock size={13} /> Block
                              </button>

                              {/* Manual Booking / Reset */}
                              <button
                                className="av-action-btn av-action-btn--edit"
                                onClick={() => {
                                  setSlotAction({ type: 'manual-booking', slot });
                                }}
                                disabled={slotActionLoading || slot.status === 'full'}
                                title={slot.status === 'full' ? 'Slot Full' : 'Manual Booking'}
                              >
                                <Plus size={13} /> Manual Booking
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={page}
                  totalPages={dailyData.totalPages || 1}
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <p className="av-empty">No slots configured for this date.</p>
            )}

            {/* Modal for Manual Booking */}
            {slotAction?.type === 'manual-booking' && (
              <div className="av-modal-backdrop" onClick={() => setSlotAction(null)}>
                <div className="av-modal" onClick={e => e.stopPropagation()}>
                  <button className="av-modal-close-btn" onClick={() => setSlotAction(null)}>
                    &times;
                  </button>
                  <h3>Manual Booking</h3>
                  <p style={{ marginBottom: '15px', color: 'var(--gray)', fontSize: '0.875rem' }}>
                    {viewDateDisplay} | {to12h(slotAction.slot.startTime)} - {to12h(slotAction.slot.endTime)}
                  </p>

                  <div className="av-field">
                    <label className="av-label">Customer Name *</label>
                    <input type="text" className="av-input" value={manualBookingForm.customerName} onChange={e => setManualBookingForm({ ...manualBookingForm, customerName: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="av-field">
                    <label className="av-label">Mobile Number *</label>
                    <input type="text" className="av-input" value={manualBookingForm.mobileNumber} onChange={e => setManualBookingForm({ ...manualBookingForm, mobileNumber: e.target.value })} placeholder="9876543210" />
                  </div>
                  <div className="av-field">
                    <label className="av-label">Vehicle Number *</label>
                    <input type="text" className="av-input" value={manualBookingForm.vehicleNumber} onChange={e => setManualBookingForm({ ...manualBookingForm, vehicleNumber: e.target.value })} placeholder="KA-01-AB-1234" />
                  </div>
                  <div className="av-field">
                    <label className="av-label">Vehicle Type</label>
                    <select className="av-input av-select" value={manualBookingForm.vehicleType} onChange={e => setManualBookingForm({ ...manualBookingForm, vehicleType: e.target.value })}>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                  <div className="av-field">
                    <label className="av-label">Service *</label>
                    <select className="av-input av-select" value={manualBookingForm.serviceId} onChange={e => setManualBookingForm({ ...manualBookingForm, serviceId: e.target.value })}>
                      {services.map(s => <option key={s._id} value={s._id}>{s.serviceName} (₹{s.price})</option>)}
                    </select>
                  </div>
                  <div className="av-field">
                    <label className="av-label">Notes (Optional)</label>
                    <textarea className="av-input" value={manualBookingForm.notes} onChange={e => setManualBookingForm({ ...manualBookingForm, notes: e.target.value })} placeholder="Any special requests..."></textarea>
                  </div>

                  <div className="av-modal-footer">
                    <button className="btn btn-outline" onClick={() => setSlotAction(null)} disabled={slotActionLoading}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveManualBookingClick} disabled={slotActionLoading}>
                      {slotActionLoading ? 'Saving...' : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ConfirmModal 
              isOpen={showManualBookingConfirm}
              title="Manual Booking"
              message="Do you want to create this manual booking?"
              confirmText="Book Now"
              cancelText="Cancel"
              type="primary"
              onConfirm={handleSaveManualBooking}
              onCancel={() => setShowManualBookingConfirm(false)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAvailabilityPage;
