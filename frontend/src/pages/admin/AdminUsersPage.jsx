import React, { useState, useEffect } from 'react';
import { getCustomers, toggleBlockUser } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ show: false, user: null });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers({ page, limit: 5, search: searchTerm });
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
      } else {
        setUsers(Array.isArray(data) ? data : []);
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
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleToggleClick = (user) => {
    setConfirmModal({ show: true, user });
  };

  const executeToggle = async () => {
    const { user } = confirmModal;
    try {
      await toggleBlockUser(user._id);
      fetchUsers(); // refresh
      toast.success(user.isBlocked ? 'User unblocked successfully.' : 'User blocked successfully.');
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setConfirmModal({ show: false, user: null });
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h2>Customer Management</h2>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading customers...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        background: user.isBlocked ? '#fee2e2' : '#dcfce3',
                        color: user.isBlocked ? '#dc2626' : '#16a34a'
                      }}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', borderColor: user.isBlocked ? '#16a34a' : '#dc2626', color: user.isBlocked ? '#16a34a' : '#dc2626' }}
                        onClick={() => handleToggleClick(user)}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No customers found</td></tr>}
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

      {confirmModal.user && (
        <ConfirmModal 
          isOpen={confirmModal.show}
          title={confirmModal.user.isBlocked ? 'Unblock User' : 'Block User'}
          message={confirmModal.user.isBlocked ? 'Are you sure you want to unblock this user?' : 'Are you sure you want to block this user?'}
          confirmText={confirmModal.user.isBlocked ? 'Unblock' : 'Block'}
          cancelText="Cancel"
          type={confirmModal.user.isBlocked ? 'primary' : 'danger'}
          onConfirm={executeToggle}
          onCancel={() => setConfirmModal({ show: false, user: null })}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
