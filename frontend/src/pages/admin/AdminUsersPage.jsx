import React, { useState, useEffect } from 'react';
import { getCustomers, toggleBlockUser } from '../../services/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getCustomers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (id) => {
    try {
      await toggleBlockUser(id);
      fetchUsers(); // refresh
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h2>Customer Management</h2>
      </div>

      <div className="card" style={{marginBottom: '1.5rem', padding:'1rem 1.5rem'}}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{maxWidth:'400px'}}
        />
      </div>

      <div className="card" style={{padding:0}}>
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
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    padding:'0.25rem 0.5rem', borderRadius:'4px', fontSize:'0.75rem', fontWeight:600,
                    background: user.isBlocked ? '#fee2e2' : '#dcfce3',
                    color: user.isBlocked ? '#dc2626' : '#16a34a'
                  }}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-outline" 
                    style={{padding:'0.25rem 0.5rem', fontSize:'0.875rem', borderColor: user.isBlocked ? '#16a34a' : '#dc2626', color: user.isBlocked ? '#16a34a' : '#dc2626'}}
                    onClick={() => handleToggleBlock(user._id)}
                  >
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No customers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
