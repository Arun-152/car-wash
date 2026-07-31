import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getBookingById, cancelBooking } from '../../services/api';
import './MyBookingsDetailsPage.css';

const MyBookingsDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const fetchBooking = async () => {
    try {
      const data = await getBookingById(id);
      setBooking(data);
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      setCancelError(null);
      try {
        await cancelBooking(id);
        fetchBooking(); // Refresh data to show cancelled status
        alert('Booking cancelled successfully.');
      } catch (err) {
        setCancelError(err.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  if (loading) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>Loading...</div><Footer /></div>;
  if (error || !booking) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>{error}</div><Footer /></div>;

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      
      <div className="container booking-details-container">
        <div className="details-header">
          <Link to="/my-bookings" className="back-link">← Back to My Bookings</Link>
          <h2>Booking Details</h2>
        </div>

        {cancelError && <div className="error-message">{cancelError}</div>}

        <div className="booking-details-card card" style={{padding: '2rem'}}>
          <div className="card-top">
            <div className="code-block">
              <span>Booking Code</span>
              <h3>{booking.bookingCode}</h3>
            </div>
            <div className="status-block">
              <span className={`status-badge badge-${booking.bookingStatus === 'cancelled' ? 'danger' : booking.bookingStatus === 'completed' ? 'success' : 'info'}`}>
                {booking.bookingStatus}
              </span>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-section">
              <h4>Center Information</h4>
              <p><strong>{booking.washCenterId?.name}</strong></p>
              <p>{booking.washCenterId?.address}</p>
              <p>{booking.washCenterId?.city}</p>
            </div>

            <div className="detail-section">
              <h4>Appointment</h4>
              <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
            </div>

            <div className="detail-section">
              <h4>Service Details</h4>
              <p><strong>Service:</strong> {booking.serviceId?.serviceName}</p>
              <p><strong>Vehicle:</strong> {booking.vehicleId?.brand} {booking.vehicleId?.model} ({booking.vehicleId?.vehicleNumber})</p>
            </div>

            <div className="detail-section payment-section">
              <h4>Payment</h4>
              <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>
              <p><strong>Status:</strong> <span className={booking.paymentStatus}>{booking.paymentStatus}</span></p>
            </div>
          </div>

          <div className="card-actions">
            {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed') && (
              <button className="btn btn-danger" onClick={handleCancel}>
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyBookingsDetailsPage;
