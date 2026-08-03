import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getBookingById } from '../../services/api';
import './BookingConfirmationPage.css';

const to12h = (timeStr) => {
  if (!timeStr) return '';
  const [hRaw, m] = timeStr.split(':');
  const h = parseInt(hRaw, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m} ${suffix}`;
};

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await getBookingById(id);
        setBooking(data);
      } catch (err) {
        setError('Failed to load booking details. Please check My Bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading)
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        Loading your booking…
      </div>
    );

  if (error || !booking)
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#dc2626' }}>
        {error || 'Booking not found.'}
        <br />
        <Link to="/my-bookings" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
          View My Bookings
        </Link>
      </div>
    );

  const bookingDateFormatted = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-wrapper bg-light">
      <div className="container confirmation-container">
        <div className="confirmation-card card" style={{ padding: '3rem', textAlign: 'center' }}>

          {/* Success Icon */}
          <div className="success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#10b981' }}>
            <CheckCircle size={72} strokeWidth={1.5} />
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Your car wash appointment has been successfully booked.
          </p>

          {/* Booking Code */}
          <div className="booking-code-box">
            <span>Booking Code</span>
            <h3>{booking.bookingCode}</h3>
          </div>

          {/* Details */}
          <div className="confirmation-details">
            <div className="detail-row">
              <span>Service</span>
              <strong>{booking.serviceId?.serviceName}</strong>
            </div>
            <div className="detail-row">
              <span>Duration</span>
              <strong>{booking.serviceId?.duration} minutes</strong>
            </div>
            <div className="detail-row">
              <span>Vehicle</span>
              <strong>
                {booking.vehicleId?.brand} {booking.vehicleId?.model}
                {booking.vehicleId?.vehicleNumber && (
                  <span style={{ fontWeight: 400, color: '#94a3b8' }}> · {booking.vehicleId.vehicleNumber}</span>
                )}
              </strong>
            </div>
            <div className="detail-row">
              <span>Date</span>
              <strong>{bookingDateFormatted}</strong>
            </div>
            <div className="detail-row">
              <span>Time</span>
              <strong>{to12h(booking.startTime)} – {to12h(booking.endTime)}</strong>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <strong style={{ textTransform: 'capitalize', color: '#10b981' }}>
                {booking.bookingStatus}
              </strong>
            </div>
            <div className="detail-row total">
              <span>Total Amount</span>
              <strong>₹{booking.totalAmount}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="confirmation-actions">
            <Link to="/my-bookings" className="btn btn-outline">View My Bookings</Link>
            <Link to="/" className="btn btn-primary">Return Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
