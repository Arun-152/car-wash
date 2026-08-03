import React, { useState, useEffect } from 'react';
import { getShopSettings, updateShopSettings, getAvailability, updateAvailability } from '../../services/api';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import './AdminPages.css';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    businessName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    description: '',
    openingTime: '09:00',
    closingTime: '18:00',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Availability state ──
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [workingDays, setWorkingDays] = useState([...DAYS.slice(0, 6)]);
  const [blockedDates, setBlockedDates] = useState([]);

  // ── Blocked date form state ──
  const [newDate, setNewDate] = useState({ date: '', reason: 'Holiday' });
  const [editDateIdx, setEditDateIdx] = useState(null);
  const [editDateVal, setEditDateVal] = useState({ date: '', reason: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [shopData, avData] = await Promise.all([getShopSettings(), getAvailability()]);
      if (shopData) {
        setSettings({ ...settings, ...shopData });
      }
      if (avData) {
        setWorkingDays(avData.workingDays || []);
        
        // Normalize blocked dates just in case
        const normalizedDates = (avData.blockedDates || []).map(bd => {
          if (bd && typeof bd === 'object' && bd.date) {
            const d = new Date(bd.date);
            return {
              _id: bd._id,
              date: [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'),
              reason: bd.reason || '',
            };
          }
          const d = new Date(bd);
          return { date: [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'), reason: '' };
        });
        setBlockedDates(normalizedDates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        updateShopSettings(settings),
        updateAvailability({ workingDays, blockedDates })
      ]);
      toast.success('Shop settings updated successfully.');
      setMessage({ type: 'success', text: 'Shop settings and schedule updated successfully!' });
    } catch (err) {
      toast.error('Failed to update settings.');
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddBlockedDate = () => {
    if (!newDate.date) return;
    setBlockedDates([...blockedDates, newDate]);
    setNewDate({ date: '', reason: 'Holiday' });
  };

  const handleRemoveBlockedDate = (index) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index));
  };

  const saveEditBlockedDate = () => {
    const arr = [...blockedDates];
    arr[editDateIdx] = editDateVal;
    setBlockedDates(arr);
    setEditDateIdx(null);
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="admin-page">
      <h2>Shop Settings</h2>
      <p>Configure your shop details here. These details will be displayed to customers.</p>
      
      <form onSubmit={handleSubmitClick} className="admin-form card" style={{ padding: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}
        <div className="form-group">
          <label>Business Name</label>
          <input type="text" name="businessName" value={settings.businessName} onChange={handleChange} required className="input-field" />
        </div>
        
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Email</label>
            <input type="email" name="email" value={settings.email} onChange={handleChange} required className="input-field" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Phone Number</label>
            <input type="text" name="phone" value={settings.phone} onChange={handleChange} required className="input-field" />
          </div>
        </div>

        <div className="form-group">
          <label>Address</label>
          <input type="text" name="address" value={settings.address} onChange={handleChange} required className="input-field" />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>City</label>
            <input type="text" name="city" value={settings.city} onChange={handleChange} className="input-field" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>State</label>
            <input type="text" name="state" value={settings.state} onChange={handleChange} className="input-field" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Zip Code</label>
            <input type="text" name="zipCode" value={settings.zipCode} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={settings.description} onChange={handleChange} rows="4" className="input-field"></textarea>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-light)' }} />

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>Shop Schedule</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>Select the days and times your shop is open.</p>

        <div className="form-group">
          <label>Working Days</label>
          <div className="days-toggle-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                className={`btn ${workingDays.includes(day) ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleDayToggle(day)}
                style={{ borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Opening Time</label>
            <input type="time" name="openingTime" value={settings.openingTime} onChange={handleChange} required className="input-field" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Closing Time</label>
            <input type="time" name="closingTime" value={settings.closingTime} onChange={handleChange} required className="input-field" />
          </div>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-light)' }} />

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>Blocked Dates</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>Add dates when the shop will be completely closed.</p>
        
        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" className="input-field" value={newDate.date} onChange={e => setNewDate({...newDate, date: e.target.value})} />
          </div>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label>Reason</label>
            <select className="input-field" value={newDate.reason} onChange={e => setNewDate({...newDate, reason: e.target.value})}>
              {['Holiday', 'Maintenance', 'Shop Closed', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleAddBlockedDate} disabled={!newDate.date} style={{ height: '42px' }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {blockedDates.length > 0 ? (
          <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedDates.map((bd, i) => (
                  <tr key={i}>
                    <td>
                      {editDateIdx === i ? (
                        <input type="date" className="input-field" value={editDateVal.date} onChange={e => setEditDateVal({...editDateVal, date: e.target.value})} />
                      ) : (
                        new Date(bd.date).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      {editDateIdx === i ? (
                        <select className="input-field" value={editDateVal.reason} onChange={e => setEditDateVal({...editDateVal, reason: e.target.value})}>
                          {['Holiday', 'Maintenance', 'Shop Closed', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className="badge badge-warning">{bd.reason || 'Closed'}</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {editDateIdx === i ? (
                          <>
                            <button type="button" className="btn-icon text-success" onClick={saveEditBlockedDate}><Check size={18} /></button>
                            <button type="button" className="btn-icon text-danger" onClick={() => setEditDateIdx(null)}><X size={18} /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn-icon text-primary" onClick={() => { setEditDateIdx(i); setEditDateVal(bd); }}><Pencil size={18} /></button>
                            <button type="button" className="btn-icon text-danger" onClick={() => handleRemoveBlockedDate(i)}><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--gray-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--gray)' }}>No blocked dates configured.</p>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Settings & Schedule'}
          </button>
        </div>
      </form>

      <ConfirmModal 
        isOpen={showConfirmModal}
        title="Shop Settings"
        message="Do you want to save these shop settings?"
        confirmText="Save Settings"
        cancelText="Cancel"
        type="primary"
        onConfirm={executeSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default AdminSettingsPage;
