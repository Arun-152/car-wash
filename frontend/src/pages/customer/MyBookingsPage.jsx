import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Car } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getMyBookings } from '../../services/api';
import './MyBookingsPage.css';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getFilteredBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDate);
      
      if (activeTab === 'cancelled') {
        return booking.bookingStatus === 'cancelled';
      }
      if (activeTab === 'completed') {
        return booking.bookingStatus === 'completed' || (booking.bookingStatus !== 'cancelled' && bookingDate < today);
      }
      if (activeTab === 'upcoming') {
        return (booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'in-progress') && bookingDate >= today;
      }
      return false;
    });
  };

  const filteredBookings = getFilteredBookings();

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      'in-progress': 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return <span className={`status-badge ${colors[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      
      <div className="container bookings-page-container">
        <div className="bookings-header">
          <h2>My Bookings</h2>
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button 
              className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state card" style={{ padding: '2rem', textAlign: 'center' }}>Loading your bookings...</div>
        ) : error ? (
          <div className="error-state card" style={{ padding: '2rem', textAlign: 'center' }}>{error}</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No {activeTab} bookings found</h3>
            <p style={{ color: 'var(--text-muted)' }}>You don't have any {activeTab} appointments at the moment.</p>
            {activeTab === 'upcoming' && (
              <Link to="/centers" className="btn btn-primary" style={{marginTop: '1.5rem'}}>
                Find a Car Wash
              </Link>
            )}
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map(booking => (
              <div key={booking._id} className="booking-list-card card card-hover" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <span className="booking-code" style={{ fontWeight: '600' }}>{booking.bookingCode}</span>
                  {getStatusBadge(booking.bookingStatus)}
                </div>
                
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="info-column">
                    <h4 style={{ marginBottom: '0.25rem' }}>{booking.washCenterId?.name}</h4>
                    <p className="service-name" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{booking.serviceId?.serviceName}</p>
                    <p className="vehicle-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <Car size={16} /> {booking.vehicleId?.brand} {booking.vehicleId?.model} ({booking.vehicleId?.vehicleNumber})
                    </p>
                  </div>
                  
                  <div className="time-column" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="date-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--primary)" />
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="date-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="var(--primary)" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </div>
                  
                  <div className="price-column">
                    <span className="amount">₹{booking.totalAmount}</span>
                    <span className={`payment-status ${booking.paymentStatus}`}>{booking.paymentStatus}</span>
                  </div>
                </div>
                
                <div className="card-footer">
                  <Link to={`/my-bookings/${booking._id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyBookingsPage;
