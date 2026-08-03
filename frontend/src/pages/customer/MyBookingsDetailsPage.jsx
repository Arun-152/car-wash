import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getBookingById, requestCancellation } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import './MyBookingsDetailsPage.css';

const MyBookingsDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
    setCancelError(null);
    try {
      await requestCancellation(id, cancelReason);
      setShowCancelModal(false);
      fetchBooking(); // Refresh data to show requested status
      toast.success('Booking cancelled successfully.');
    } catch (err) {
      toast.error('Cancel failed.');
      setCancelError(err.response?.data?.message || 'Failed to request cancellation');
    }
  };

  if (loading) return <div><div className="container" style={{ padding: '4rem' }}>Loading...</div></div>;
  if (error || !booking) return <div><div className="container" style={{ padding: '4rem' }}>{error}</div></div>;

  const bDate = new Date(booking.bookingDate);
  const dateStr = [bDate.getFullYear(), String(bDate.getMonth() + 1).padStart(2, '0'), String(bDate.getDate()).padStart(2, '0')].join('-');
  const bookingDateTimeStr = `${dateStr}T${booking.startTime}:00`;
  const bookingDateTime = new Date(bookingDateTimeStr);
  const diffInHours = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const isCancelExpired = diffInHours < 1;

  return (
    <div className="page-wrapper bg-light">
      <div className="container booking-details-container">
        <div className="details-header">
          <Link to="/my-bookings" className="back-link">← Back to My Bookings</Link>
          <h2>Booking Details</h2>
        </div>

        {cancelError && <div className="error-message">{cancelError}</div>}

        <div className="booking-details-card card" style={{ padding: '2rem' }}>
          <div className="card-top">
            <div className="code-block">
              <span>Booking Code</span>
              <h3>{booking.bookingCode}</h3>
            </div>
            <div className="status-block">
              <span className={`status-badge badge-${booking.bookingStatus === 'cancelled' ? 'danger' :
                  booking.bookingStatus === 'completed' ? 'success' :
                    booking.bookingStatus === 'cancellation-requested' ? 'warning' : 'info'
                }`}>
                {booking.bookingStatus === 'cancellation-requested' ? 'Cancellation Requested' : booking.bookingStatus}
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

          <div className="cancellation-policy" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <h4 style={{ color: '#b45309', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Cancellation Policy
            </h4>
            <ul style={{ color: '#92400e', margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
              <li>Cancellation requests are accepted only up to 1 hour before your scheduled appointment.</li>
              <li>After that time, cancellation and refunds are not available.</li>
              <li>Refunds are processed only after Admin approval and will be credited to your Wallet.</li>
            </ul>
          </div>

          <div className="card-actions">
            {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed') && (
              isCancelExpired ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <button className="btn btn-danger" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    Request Cancellation
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                    Cancellation period has expired.
                  </span>
                </div>
              ) : (
                <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
                  Request Cancellation
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showCancelModal}
        title="Request Cancellation"
        message="Please provide a reason for cancelling this booking."
        confirmText="Submit Request"
        cancelText="Keep Booking"
        type="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      >
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          style={{ width: '100%', minHeight: '100px', marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
        />
      </ConfirmModal>
    </div>
  );
};

export default MyBookingsDetailsPage;
