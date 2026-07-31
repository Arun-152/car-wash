import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getBookingById } from '../../services/api';
import './BookingConfirmationPage.css';

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
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>Loading...</div><Footer /></div>;
  if (error || !booking) return <div><Navbar /><div className="container" style={{padding:'4rem'}}>{error}</div><Footer /></div>;

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      
      <div className="container confirmation-container">
        <div className="confirmation-card card" style={{padding: '3rem', textAlign: 'center'}}>
          <div className="success-icon" style={{display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#10b981'}}><CheckCircle size={64} /></div>
          <h2>Booking Confirmed!</h2>
          <p>Your car wash appointment has been successfully booked.</p>
          
          <div className="booking-code-box">
            <span>Booking Code</span>
            <h3>{booking.bookingCode}</h3>
          </div>

          <div className="confirmation-details">
            <div className="detail-row">
              <span>Center:</span>
              <strong>{booking.washCenterId?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Address:</span>
              <strong>{booking.washCenterId?.address}, {booking.washCenterId?.city}</strong>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <strong>{new Date(booking.bookingDate).toLocaleDateString()}</strong>
            </div>
            <div className="detail-row">
              <span>Time:</span>
              <strong>{booking.startTime} - {booking.endTime}</strong>
            </div>
            <div className="detail-row">
              <span>Vehicle:</span>
              <strong>{booking.vehicleId?.brand} {booking.vehicleId?.model} ({booking.vehicleId?.vehicleNumber})</strong>
            </div>
            <div className="detail-row">
              <span>Service:</span>
              <strong>{booking.serviceId?.serviceName}</strong>
            </div>
            <div className="detail-row total">
              <span>Amount to Pay at Center:</span>
              <strong>₹{booking.totalAmount}</strong>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/my-bookings" className="btn btn-outline">View My Bookings</Link>
            <Link to="/" className="btn btn-primary">Return Home</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmationPage;
