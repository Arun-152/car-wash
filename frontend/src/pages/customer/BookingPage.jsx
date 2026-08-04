import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import {
  getServices,
  getMyVehicles,
  getAvailableSlots,
  createBooking,
  createPaymentOrder,
  verifyPayment,
  getPublicAvailability,
  getShopSettings,
} from '../../services/api';
import './BookingPage.css';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Convert "HH:MM" → "hh:MM AM/PM" */
const to12h = (timeStr) => {
  if (!timeStr) return '';
  const [hRaw, m] = timeStr.split(':');
  const h = parseInt(hRaw, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m} ${suffix}`;
};

/** "YYYY-MM-DD" → "Monday, 31 July 2026" */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // Parse as local date to avoid timezone shift
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/** "YYYY-MM-DD" → JS Date object interpreted as local */
const parseLocalDate = (dateStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d);
};

/** Get today as "YYYY-MM-DD" string (local) */
const todayStr = () => {
  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const d = new Date(nowStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

// ─── Component ─────────────────────────────────────────────────────────────

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availability, setAvailability] = useState(null); // working days, breaks, blocked dates
  const [shopSettings, setShopSettings] = useState(null); // opening/closing time

  // UI state
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [dateMessage, setDateMessage] = useState(null); // per-date warning/info
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicleValidationError, setVehicleValidationError] = useState(null);
  const [errors, setErrors] = useState({});

  // ── Vehicle Validation Helper ──────────────────────────────────────────
  const validateVehicleCompatibility = useCallback((service, vehicle) => {
    if (!service || !vehicle) return null;
    const sName = service.serviceName.toLowerCase();
    const vType = vehicle.vehicleType.toLowerCase();

    if (sName.includes('bike') || sName.includes('two wheeler')) {
      if (vType !== 'bike') return 'This service is available only for Bike vehicles.';
    } else if (sName.includes('heavy') || sName.includes('truck')) {
      if (vType !== 'heavy' && vType !== 'truck') return 'This service is available only for Heavy vehicles.';
    } else if (sName.includes('car') || sName.includes('suv') || sName.includes('four wheeler')) {
      if (!['car', 'suv', 'ev car', 'ev'].includes(vType)) {
        return 'Please select a compatible vehicle for the chosen service.';
      }
    }
    return null;
  }, []);

  // ── Load initial data ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [srvData, vehicleData, avData, shopData] = await Promise.all([
          getServices(),
          getMyVehicles(),
          getPublicAvailability(),
          getShopSettings(),
        ]);

        const activeServices = srvData.filter((s) => s.isActive);
        setServices(activeServices);
        setVehicles(vehicleData);
        setAvailability(avData);
        setShopSettings(shopData);

        // Pre-select service if navigated from "Book Now" button
        let initialSrv = null;
        if (location.state?.selectedService) {
          initialSrv = activeServices.find(
            (s) => s._id === location.state.selectedService
          );
          if (initialSrv) setSelectedService(initialSrv);
        } else if (activeServices.length > 0) {
          initialSrv = activeServices[0];
          setSelectedService(initialSrv);
        }

        // Pre-select first vehicle if available
        if (vehicleData.length > 0) {
          setSelectedVehicle(vehicleData[0]);
          if (initialSrv) {
            setVehicleValidationError(validateVehicleCompatibility(initialSrv, vehicleData[0]));
          }
        }
      } catch (err) {
        setError('Failed to load booking details. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [location.state]);

  // ── Date validation helper ─────────────────────────────────────────────

  const validateDate = useCallback(
    (dateStr) => {
      if (!dateStr || !availability) return null;

      const date = parseLocalDate(dateStr);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Check working days
      if (
        availability.workingDays &&
        availability.workingDays.length > 0 &&
        !availability.workingDays.includes(dayName)
      ) {
        return {
          type: 'error',
          msg: `The shop is closed on ${dayName}s. Working days: ${availability.workingDays.join(', ')}.`,
        };
      }

      // Check blocked dates — handle both old [Date] and new [{date, reason}] formats
      if (availability.blockedDates && availability.blockedDates.length > 0) {
        const dateTime = date.getTime();
        const isBlocked = availability.blockedDates.some((bd) => {
          const blocked = new Date(bd?.date ?? bd);
          blocked.setHours(0, 0, 0, 0);
          return blocked.getTime() === dateTime;
        });
        if (isBlocked) {
          return {
            type: 'error',
            msg: 'The shop is closed on this date (holiday/blocked day). Please choose another date.',
          };
        }
      }

      return null;
    },
    [availability]
  );

  // ── Fetch slots whenever date or service changes ───────────────────────

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedService) return;

      // Validate date first
      const validationError = validateDate(selectedDate);
      setDateMessage(validationError);
      setAvailableSlots([]);
      setSelectedSlot(null);

      if (validationError) return; // Don't fetch slots for invalid dates

      setSlotsLoading(true);
      setBookingError(null);
      try {
        const slots = await getAvailableSlots(selectedDate, selectedService.duration, selectedService._id);
        setAvailableSlots(slots);
        if (slots.length === 0) {
          const isToday = selectedDate === todayStr();
          setDateMessage({
            type: 'info',
            msg: isToday 
              ? 'No available slots for today. Please choose another date.'
              : 'No available time slots for this date. All slots are fully booked or the shop is closed. Please choose another date.',
          });
        } else {
          setDateMessage(null);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to fetch available slots.';
        setDateMessage({ type: 'error', msg });
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService, validateDate]);

  // ── Razorpay loader ────────────────────────────────────────────────────

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ── Confirm booking & launch Razorpay ─────────────────────────────────

  const handleConfirmBookingClick = () => {
    setBookingError(null);
    setErrors({});

    const newErrors = {};
    if (!selectedService) newErrors.service = 'Please select a service.';
    
    if (!selectedVehicle) {
      newErrors.vehicle = 'Please select a vehicle or add one if you haven\'t already.';
    } else if (vehicleValidationError) {
      newErrors.vehicle = 'Please select a compatible vehicle for the chosen service.';
    }
    
    if (!selectedDate) newErrors.date = 'Please select a date.';
    else if (dateMessage?.type === 'error') newErrors.date = dateMessage.msg;
    
    if (!selectedSlot) newErrors.slot = 'Please select a time slot.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowPaymentModal(false);
    setIsSubmitting(true);
    try {
      // 1. Create booking (backend re-validates slot availability)
      const payload = {
        serviceId: selectedService._id,
        vehicleId: selectedVehicle._id,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        totalAmount: selectedService.price,
      };
      const bookingResponse = await createBooking(payload);

      // 2. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setBookingError('Razorpay SDK failed to load. Please check your internet connection.');
        setIsSubmitting(false);
        return;
      }

      // 3. Create payment order
      const orderData = await createPaymentOrder(bookingResponse._id);

      // 4. Launch Razorpay checkout
      console.log("FRONTEND KEY:", import.meta.env.VITE_RAZORPAY_KEY_ID);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Car Wash Booking',
        description: `Payment for ${selectedService.serviceName}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingResponse._id,
            });
            toast.success('Payment completed successfully.');
            navigate(`/payment-success/${bookingResponse._id}`);
          } catch {
            toast.error('Payment failed.');
            navigate(`/payment-failed/${bookingResponse._id}`);
          }
        },
        prefill: { name: 'Customer', email: 'customer@example.com' },
        theme: { color: '#3b82f6' },
        modal: {
          ondismiss: () => {
            // Check if we actually completed payment, otherwise it's just a closure
            console.log("Razorpay Checkout closed.");
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed.');
        setBookingError(`Payment Failed: ${response.error.description || 'Unknown Error'}`);
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        'Failed to create booking. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  // ── Event Handlers ─────────────────────────────────────────────────────

  const handleServiceChange = (e) => {
    const srv = services.find(s => s._id === e.target.value);
    setSelectedService(srv || null);
    setSelectedSlot(null); // reset slot when duration might change
    setErrors({ ...errors, service: '', slot: '' });
    
    if (srv && selectedVehicle) {
      const err = validateVehicleCompatibility(srv, selectedVehicle);
      setVehicleValidationError(err);
      if (err) toast.error(err);
    } else {
      setVehicleValidationError(null);
    }
  };

  const handleVehicleChange = (e) => {
    const v = vehicles.find(v => v._id === e.target.value);
    setSelectedVehicle(v || null);
    setErrors({ ...errors, vehicle: '' });
    
    if (selectedService && v) {
      const err = validateVehicleCompatibility(selectedService, v);
      setVehicleValidationError(err);
      if (err) toast.error(err);
    } else {
      setVehicleValidationError(null);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading)
    return (
      <div className="page-wrapper bg-light">
        <Navbar />
        <div className="container booking-container">
          <div className="booking-loading card">
            <div className="loading-spinner" />
            <p>Loading booking details…</p>
          </div>
        </div>
        <Footer />
      </div>
    );

  if (error)
    return (
      <div className="page-wrapper bg-light">
        <Navbar />
        <div className="container booking-container">
          <div className="booking-error-card card">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="page-wrapper bg-light">
      <div className="container booking-container">

        <div className="booking-header">
          <h2>Book Your Appointment</h2>
        </div>

        {/* Global error banner */}
        {bookingError && (
          <div className="booking-alert booking-alert--error">{bookingError}</div>
        )}

        <div className="booking-layout">

          {/* ══ LEFT COLUMN: FORM ══ */}
          <div className="booking-form-col">

            {/* 1. Service Selection */}
            <div className="booking-section">
              <h3>1. Select Service</h3>
              {services.length === 0 ? (
                <p className="empty-state">No active services available at the moment.</p>
              ) : (
                <div className="form-group">
                  <select
                    className="form-select"
                    value={selectedService?._id || ''}
                    onChange={handleServiceChange}
                  >
                    <option value="" disabled>-- Choose a Service --</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>{s.serviceName}</option>
                    ))}
                  </select>

                  {selectedService && (
                    <div className="service-info-card">
                      <p>{selectedService.description}</p>
                      <div className="meta">
                        <span>⏱ {selectedService.duration} mins</span>
                        <span className="meta-price">₹{selectedService.price}</span>
                      </div>
                    </div>
                  )}
                  {errors.service && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.service}</span>}
                </div>
              )}
            </div>

            {/* 2. Vehicle Selection */}
            <div className="booking-section">
              <h3>2. Select Vehicle</h3>
              {vehicles.length === 0 ? (
                <button
                  className="add-vehicle-btn"
                  onClick={() => navigate('/my-vehicles')}
                >
                  + Add a Vehicle First
                </button>
              ) : (
                <div className="form-group">
                  <select
                    className="form-select"
                    value={selectedVehicle?._id || ''}
                    onChange={handleVehicleChange}
                  >
                    <option value="" disabled>-- Choose your Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.vehicleNumber})</option>
                    ))}
                  </select>
                  {vehicleValidationError && (
                    <div className="booking-alert booking-alert--error" style={{ marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                      {vehicleValidationError}
                    </div>
                  )}
                  {errors.vehicle && !vehicleValidationError && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.vehicle}</span>}
                </div>
              )}
            </div>

            {/* 3. Date & Time Selection */}
            <div className="booking-section">
              <h3>3. Date & Time</h3>

              {shopSettings && (
                <div className="booking-alert booking-alert--info" style={{ marginBottom: '1.5rem' }}>
                  <strong>Shop hours:</strong> {to12h(shopSettings.openingTime)} – {to12h(shopSettings.closingTime)}<br />
                  {availability?.workingDays && (
                    <span><strong>Open:</strong> {availability.workingDays.join(', ')}</span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="booking-date">Choose Date</label>
                <input
                  id="booking-date"
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  min={todayStr()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setBookingError(null);
                    setErrors({ ...errors, date: '' });
                  }}
                />
                {errors.date && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.date}</span>}
              </div>

              {selectedDate && dateMessage && (
                <div className={`booking-alert booking-alert--${dateMessage.type}`}>
                  {dateMessage.msg}
                </div>
              )}

              {selectedDate && !dateMessage?.type && selectedService && (
                <div className="slots-wrapper" style={{ marginTop: '1.5rem' }}>
                  <h4>
                    Available Slots
                    <span className="slots-subtitle">
                      ({selectedService.duration} min)
                    </span>
                  </h4>

                  {slotsLoading ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--gray)' }}>
                      <div className="loading-spinner loading-spinner--sm" />
                      <span>Checking availability…</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="booking-alert booking-alert--warning" style={{ marginTop: '0.5rem' }}>
                      No available slots for this date.
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`slot-btn${selectedSlot === slot ? ' selected' : ''}`}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setBookingError(null);
                          }}
                          type="button"
                        >
                          <span className="slot-time">{to12h(slot.startTime)}</span>
                          <span className="slot-end">– {to12h(slot.endTime)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.slot && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.slot}</span>}
                </div>
              )}
            </div>

          </div>

          {/* ══ RIGHT COLUMN: SUMMARY ══ */}
          <div className="booking-summary-col">
            <div className="summary-card">
              <h3>Booking Summary</h3>

              <div className={`summary-row ${!selectedService ? 'summary-row--empty' : ''}`}>
                <span>Service</span>
                <strong>{selectedService ? selectedService.serviceName : 'Not selected'}</strong>
              </div>
              <div className={`summary-row ${!selectedService ? 'summary-row--empty' : ''}`}>
                <span>Duration</span>
                <strong>{selectedService ? `${selectedService.duration} minutes` : '—'}</strong>
              </div>
              <div className={`summary-row ${!selectedVehicle ? 'summary-row--empty' : ''}`}>
                <span>Vehicle</span>
                <strong>
                  {selectedVehicle ? (
                    <>
                      {selectedVehicle.brand} {selectedVehicle.model}
                      <span className="summary-plate">{selectedVehicle.vehicleNumber}</span>
                    </>
                  ) : 'Not selected'}
                </strong>
              </div>
              <div className={`summary-row ${!selectedDate ? 'summary-row--empty' : ''}`}>
                <span>Date</span>
                <strong>{selectedDate ? formatDate(selectedDate) : 'Not selected'}</strong>
              </div>
              <div className={`summary-row ${!selectedSlot ? 'summary-row--empty' : ''}`}>
                <span>Time</span>
                <strong>
                  {selectedSlot
                    ? `${to12h(selectedSlot.startTime)} – ${to12h(selectedSlot.endTime)}`
                    : 'Not selected'}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total Amount</span>
                <h2>{selectedService ? `₹${selectedService.price}` : '₹0'}</h2>
              </div>

              <button
                className="btn btn-primary btn-confirm"
                onClick={handleConfirmBookingClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading">
                    <div className="loading-spinner loading-spinner--xs" /> Processing…
                  </span>
                ) : (
                  '💳 Pay Now & Confirm'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showPaymentModal}
        title="Confirm Payment"
        message="Do you want to proceed with the payment?"
        confirmText="Proceed"
        cancelText="Cancel"
        type="primary"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowPaymentModal(false)}
      />
    </div>
  );
};

export default BookingPage;
