import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAllBookings, updateBookingStatusAdmin, approveCancellation, rejectCancellation } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import './AdminPages.css';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const context = useOutletContext() || {};
  const { refreshNotifications } = context;

  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cancelModal, setCancelModal] = useState({ show: false, bookingId: null, actionType: null });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 5,
        search: filterCode,
        status: filterStatus,
        date: filterDate,
        tab: activeTab
      };
      const data = await getAllBookings(params);
      if (data.bookings) {
        setBookings(data.bookings);
        setTotalPages(data.totalPages);
      } else {
        setBookings(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBookings();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, activeTab, filterCode, filterStatus, filterDate]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatusAdmin(bookingId, newStatus);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleApproveCancelClick = (bookingId) => {
    setCancelModal({ show: true, bookingId, actionType: 'approve' });
  };

  const handleRejectCancelClick = (bookingId) => {
    setCancelModal({ show: true, bookingId, actionType: 'reject' });
  };

  const executeCancelAction = async () => {
    const { bookingId, actionType } = cancelModal;
    setCancelModal({ show: false, bookingId: null, actionType: null });
    
    if (actionType === 'approve') {
      try {
        await approveCancellation(bookingId);
        fetchBookings();
        if (refreshNotifications) refreshNotifications();
        toast.success('Cancellation approved successfully.');
      } catch (err) {
        toast.error('Approval failed.');
      }
    } else if (actionType === 'reject') {
      try {
        await rejectCancellation(bookingId);
        fetchBookings();
        if (refreshNotifications) refreshNotifications();
        toast.success('Cancellation rejected successfully.');
      } catch (err) {
        toast.error('Rejection failed.');
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const clearFilters = () => {
    setFilterCode('');
    setFilterStatus('');
    setFilterDate('');
    setPage(1);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Bookings Management</h2>
        <p>Manage and track all customer appointments and cancellation requests.</p>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleTabChange('all')}
        >
          All Bookings
        </button>
        <button
          className={`btn ${activeTab === 'cancellations' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleTabChange('cancellations')}
        >
          Cancellation Requests
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Booking Code</label>
                <input type="text" className="input-field" placeholder="Search code..." value={filterCode} onChange={(e) => { setFilterCode(e.target.value); setPage(1); }} />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</label>
                <select className="input-field" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Date</label>
                <input type="date" className="input-field" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }} />
              </div>
              <button className="btn btn-outline" style={{ height: '42px' }} onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bookings...</div>
            ) : (
              <>
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
                    {bookings.map(b => (
                      <tr key={b._id}>
                        <td>
                          <strong>{b.bookingCode}</strong>
                          {b.bookingSource === 'admin' && (
                            <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                              MANUAL
                            </span>
                          )}
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                            {new Date(b.bookingDate).toLocaleDateString()} <br /> {b.startTime} - {b.endTime}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.userId?.name || b.manualCustomerDetails?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>{b.userId?.email || ''}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>{b.userId?.phone || b.manualCustomerDetails?.phone || ''}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.serviceId?.serviceName || 'Service Deleted'}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                            Vehicle: {b.vehicleId?.brand ? `${b.vehicleId.brand} ${b.vehicleId.model}` : b.manualVehicleDetails?.vehicleType || ''}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
                            {b.vehicleId?.vehicleNumber || b.manualVehicleDetails?.vehicleNumber || ''}
                          </div>
                        </td>
                        <td>
                          <strong>₹{b.totalAmount}</strong>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.25rem', color: b.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                            {b.paymentStatus}
                          </div>
                        </td>
                        <td>
                          <select
                            className="input-field"
                            value={b.bookingStatus === 'confirmed' ? 'completed' : b.bookingStatus}
                            onChange={(e) => handleStatusChange(b._id, e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', minWidth: '130px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="cancellation-requested">Cancellation Requested</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No bookings found</td></tr>}
                  </tbody>
                </table>
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading cancellation requests...</div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking Details</th>
                    <th>Customer</th>
                    <th>Service & Amount</th>
                    <th>Cancellation Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <strong>{b.bookingCode}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                          {new Date(b.bookingDate).toLocaleDateString()} <br /> {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.userId?.name || b.manualCustomerDetails?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>{b.userId?.phone || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.serviceId?.serviceName || 'Service Deleted'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--dark)' }}>₹{b.totalAmount} ({b.paymentStatus})</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--gray)', maxWidth: '250px' }}>
                          {b.cancellationReason || 'No reason provided'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => handleApproveCancelClick(b._id)}
                          >
                            Approve Refund
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                            onClick={() => handleRejectCancelClick(b._id)}
                          >
                            Reject Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No cancellation requests found</td></tr>}
                </tbody>
              </table>
              <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}

      {cancelModal.show && (
        <ConfirmModal 
          isOpen={cancelModal.show}
          title={cancelModal.actionType === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
          message={cancelModal.actionType === 'approve' 
            ? 'Are you sure you want to approve this cancellation? This will refund the amount to the user\'s wallet and release the booking slot.'
            : 'Are you sure you want to reject this cancellation? The booking will remain confirmed.'
          }
          confirmText={cancelModal.actionType === 'approve' ? 'Approve & Refund' : 'Reject Request'}
          cancelText="Cancel"
          type={cancelModal.actionType === 'approve' ? 'danger' : 'primary'}
          onConfirm={executeCancelAction}
          onCancel={() => setCancelModal({ show: false, bookingId: null, actionType: null })}
        />
      )}
    </div>
  );
};

export default AdminBookingsPage;
