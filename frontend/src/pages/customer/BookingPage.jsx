import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getServices, getMyVehicles, getAvailableSlots, createBooking, createPaymentOrder, verifyPayment } from '../../services/api';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const srvData = await getServices();
        const activeServices = srvData.filter(s => s.isActive);
        setServices(activeServices);
        
        const vehicleData = await getMyVehicles();
        setVehicles(vehicleData);

        // Auto-select service if passed via URL query params or state
        if (location.state?.selectedService) {
          const srv = activeServices.find(s => s._id === location.state.selectedService);
          if (srv) setSelectedService(srv);
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.state]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDate && selectedService) {
        setSlotsLoading(true);
        try {
          const slots = await getAvailableSlots(selectedDate, selectedService.duration);
          setAvailableSlots(slots);
          setSelectedSlot(null);
        } catch (err) {
          setBookingError(err.response?.data?.message || 'Failed to fetch slots');
        } finally {
          setSlotsLoading(false);
        }
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService]);

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return alert('Please select a service');
    if (step === 2 && !selectedVehicle) return alert('Please select a vehicle');
    if (step === 3 && (!selectedDate || !selectedSlot)) return alert('Please select a date and time slot');
    setStep(step + 1);
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setBookingError(null);
    try {
      // 1. Create Pending Booking
      const payload = {
        serviceId: selectedService._id,
        vehicleId: selectedVehicle._id,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        totalAmount: selectedService.price
      };
      const bookingResponse = await createBooking(payload);
      
      // 2. Load Razorpay Script
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsSubmitting(false);
        return;
      }

      // 3. Create Payment Order on Backend
      const orderData = await createPaymentOrder(bookingResponse._id);

      // 4. Launch Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Car Wash Booking",
        description: `Payment for ${selectedService.serviceName}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 5. Verify Signature on Backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingResponse._id
            });
            // Success
            navigate(`/payment-success/${bookingResponse._id}`);
          } catch (verifyErr) {
            console.error('Verification Error', verifyErr);
            navigate(`/payment-failed/${bookingResponse._id}`);
          }
        },
        prefill: {
          name: "Customer", // Ideally fetch from AuthContext
          email: "customer@example.com",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function() {
            // User closed popup
            navigate(`/payment-failed/${bookingResponse._id}`);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to initialize payment');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>Loading...</div><Footer /></div>;
  if (error) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>{error}</div><Footer /></div>;

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      
      <div className="container booking-container">
        <div className="booking-header card" style={{ padding: '2rem', marginBottom: '2rem', borderBottom: 'none' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Book an Appointment</h2>
          <div className="stepper" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <div className={`step ${step >= 1 ? 'active' : ''}`} style={{ fontWeight: step >= 1 ? '600' : '400', color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>1. Service</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`} style={{ fontWeight: step >= 2 ? '600' : '400', color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>2. Vehicle</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`} style={{ fontWeight: step >= 3 ? '600' : '400', color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>3. Date & Time</div>
            <div className={`step ${step >= 4 ? 'active' : ''}`} style={{ fontWeight: step >= 4 ? '600' : '400', color: step >= 4 ? 'var(--primary)' : 'var(--text-muted)' }}>4. Confirm</div>
          </div>
        </div>

        <div className="booking-content card" style={{ padding: '2rem' }}>
          {bookingError && <div className="error-message">{bookingError}</div>}

          {/* STEP 1: SERVICE */}
          {step === 1 && (
            <div className="step-content">
              <h3>Select a Service</h3>
              {services.length === 0 ? (
                <p>No services currently available.</p>
              ) : (
                <div className="service-selection-grid">
                  {services.map(service => (
                    <div 
                      key={service._id} 
                      className={`selection-card ${selectedService?._id === service._id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(service)}
                    >
                      <h4>{service.serviceName}</h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{service.description}</p>
                      <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Duration: {service.duration} mins</span>
                        <span className="price" style={{ fontWeight: '600', color: 'var(--dark)' }}>₹{service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VEHICLE */}
          {step === 2 && (
            <div className="step-content">
              <h3>Select Your Vehicle</h3>
              {vehicles.length === 0 ? (
                <div>
                  <p>You don't have any vehicles registered.</p>
                  <button className="btn btn-outline" onClick={() => navigate('/my-vehicles')}>Add a Vehicle First</button>
                </div>
              ) : (
                <div className="vehicle-selection-grid">
                  {vehicles.map(vehicle => (
                    <div 
                      key={vehicle._id} 
                      className={`selection-card ${selectedVehicle?._id === vehicle._id ? 'selected' : ''}`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <h4>{vehicle.brand} {vehicle.model}</h4>
                      <p>{vehicle.vehicleNumber}</p>
                      <span className="badge">{vehicle.vehicleType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DATE & TIME */}
          {step === 3 && (
            <div className="step-content">
              <h3>Select Date & Time</h3>
              <div className="date-picker-wrapper">
                <label>Choose Date:</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)} 
                />
              </div>

              {selectedDate && (
                <div className="slots-wrapper">
                  <h4>Available Time Slots (Based on {selectedService.duration} min duration)</h4>
                  {slotsLoading ? (
                    <p>Loading slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="no-slots">No slots available for this date. Try another day.</p>
                  ) : (
                    <div className="slots-grid">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CONFIRMATION SUMMARY */}
          {step === 4 && (
            <div className="step-content summary-content">
              <h3>Booking Summary</h3>
              <div className="summary-card">
                <div className="summary-row">
                  <span>Service:</span>
                  <strong>{selectedService.serviceName} (₹{selectedService.price})</strong>
                </div>
                <div className="summary-row">
                  <span>Vehicle:</span>
                  <strong>{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.vehicleNumber})</strong>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <strong>{selectedDate}</strong>
                </div>
                <div className="summary-row">
                  <span>Time:</span>
                  <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>
                </div>
                <div className="summary-total">
                  <span>Total Amount to Pay:</span>
                  <h2>₹{selectedService.price}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="step-navigation">
            {step > 1 && (
              <button className="btn btn-outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button className="btn btn-primary" onClick={handleNextStep}>
                Next Step
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleConfirmBooking} disabled={isSubmitting}>
                {isSubmitting ? 'Initializing Payment...' : 'Pay Now & Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BookingPage;
