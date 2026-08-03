import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Car } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/common/Pagination';
import { getMyBookings } from '../../services/api';
import './MyBookingsPage.css';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getMyBookings({ 
          page, 
          limit: 5, 
          status: activeTab === 'all' ? '' : activeTab 
        });
        
        if (data.bookings) {
          setBookings(data.bookings);
          setTotalPages(data.totalPages);
        } else {
          setBookings(Array.isArray(data) ? data : []);
          setTotalPages(1);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [page, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1); // Reset to page 1 on filter change
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-warning',
      'payment-pending': 'badge-warning',
      'cancellation-requested': 'badge-warning',
      confirmed: 'badge-info',
      'in-progress': 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-danger'
    };
    let displayStatus = status;
    if (status === 'cancellation-requested') displayStatus = 'Cancellation Requested';
    if (status === 'payment-pending') displayStatus = 'Payment Pending';

    return <span className={`status-badge ${colors[status] || 'badge-secondary'}`}>{displayStatus}</span>;
  };

  return (
    <div className="page-wrapper bg-light">

      <div className="container bookings-page-container">
        <div className="bookings-header">
          <h2>My Bookings</h2>
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All
            </button>
            <button
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => handleTabChange('completed')}
            >
              Completed
            </button>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending')}
            >
              Pending
            </button>
            <button
              className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => handleTabChange('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state card" style={{ padding: '2rem', textAlign: 'center' }}>Loading your bookings...</div>
        ) : error ? (
          <div className="error-state card" style={{ padding: '2rem', textAlign: 'center' }}>{error}</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No {activeTab} bookings found</h3>
            <p style={{ color: 'var(--text-muted)' }}>You don't have any {activeTab} appointments at the moment.</p>
            {activeTab === 'all' && (
              <Link to="/centers" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                Find a Car Wash
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bookings-list">
              {bookings.map(booking => (
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
            
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
