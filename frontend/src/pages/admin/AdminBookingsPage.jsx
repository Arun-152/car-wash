import React, { useState, useEffect } from 'react';
import { getAllBookings, updateBookingStatusAdmin } from '../../services/api';
import './AdminPages.css';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchBookings = async () => {
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatusAdmin(bookingId, newStatus);
      fetchBookings(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(b => {
    let matchCode = true;
    let matchStatus = true;
    let matchDate = true;

    if (filterCode) matchCode = b.bookingCode?.toLowerCase().includes(filterCode.toLowerCase());
    if (filterStatus) matchStatus = b.bookingStatus === filterStatus;
    if (filterDate) matchDate = b.bookingDate?.startsWith(filterDate);

    return matchCode && matchStatus && matchDate;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>All Bookings</h2>
        <p>Manage and track all customer appointments.</p>
      </div>

      <div className="card" style={{marginBottom: '1.5rem', padding: '1.5rem'}}>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap'}}>
          <div style={{flex:1, minWidth: '150px'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Booking Code</label>
            <input type="text" className="input-field" placeholder="Search code..." value={filterCode} onChange={(e) => setFilterCode(e.target.value)} />
          </div>
          <div style={{flex:1, minWidth: '150px'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</label>
            <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div style={{flex:1, minWidth: '150px'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Date</label>
            <input type="date" className="input-field" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <button className="btn btn-outline" style={{ height: '42px' }} onClick={() => {setFilterCode(''); setFilterStatus(''); setFilterDate('');}}>Clear Filters</button>
        </div>
      </div>

      <div className="card" style={{padding:0, overflowX: 'auto'}}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking Details</th>
              <th>Customer</th>
              <th>Service Details</th>
              <th>Amount & Payment</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => (
              <tr key={b._id}>
                <td>
                  <strong>{b.bookingCode}</strong>
                  <div style={{fontSize:'0.875rem', color:'var(--gray)', marginTop: '0.25rem'}}>
                    {new Date(b.bookingDate).toLocaleDateString()} <br/> {b.startTime} - {b.endTime}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.userId?.name}</div>
                  <div style={{fontSize:'0.875rem', color:'var(--gray)'}}>{b.userId?.email}</div>
                  <div style={{fontSize:'0.875rem', color:'var(--gray)'}}>{b.userId?.phone}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.serviceId?.serviceName || 'Service Deleted'}</div>
                  <div style={{fontSize:'0.875rem', color:'var(--gray)', marginTop: '0.25rem'}}>
                    Vehicle: {b.vehicleId?.brand} {b.vehicleId?.model}
                  </div>
                  <div style={{fontSize:'0.875rem', color:'var(--gray)'}}>
                    {b.vehicleId?.vehicleNumber}
                  </div>
                </td>
                <td>
                  <strong>₹{b.totalAmount}</strong>
                  <div style={{fontSize:'0.75rem', textTransform:'uppercase', fontWeight: 600, marginTop: '0.25rem', color: b.paymentStatus==='paid' ? 'var(--success)' : 'var(--warning)'}}>
                    {b.paymentStatus}
                  </div>
                </td>
                <td>
                  <select 
                    className="input-field" 
                    value={b.bookingStatus} 
                    onChange={(e) => handleStatusChange(b._id, e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', minWidth: '130px' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding: '2rem'}}>No bookings found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookingsPage;
