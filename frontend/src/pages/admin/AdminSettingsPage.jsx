import React, { useState, useEffect } from 'react';
import { getShopSettings, updateShopSettings, getAvailability, updateAvailability } from '../../services/api';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import './AdminPages.css';

const to12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hNum = parseInt(h, 10);
  const suffix = hNum >= 12 ? 'PM' : 'AM';
  const hours = hNum % 12 || 12;
  return `${hours}:${m} ${suffix}`;
};

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    shopName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    description: '',
    openingTime: '09:00',
    closingTime: '18:00',
    images: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

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
        if (shopData._id || shopData.shopName) {
          setIsEditing(false);
        }
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, images: [reader.result] }));
      };
      reader.readAsDataURL(file);
    }
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
      setIsEditing(false);
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
      
      {!isEditing ? (
        <div className="admin-form card" style={{ padding: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-light)', paddingBottom: '1rem', color: 'var(--dark)' }}>SHOP DETAILS</h3>
          
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Shop Name</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--dark)' }}>{settings.shopName || 'Not Set'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Phone</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--dark)' }}>{settings.phone || 'Not Set'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Email</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--dark)' }}>{settings.email || 'Not Set'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Working Hours</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--dark)' }}>{to12h(settings.openingTime)} - {to12h(settings.closingTime)}</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Address</p>
            <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--dark)', lineHeight: 1.5 }}>
              {settings.address}<br />
              {settings.city ? `${settings.city}, ${settings.state} ${settings.zipCode}` : ''}
            </p>
          </div>
          
          {settings.images && settings.images.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Shop Image</p>
              <img src={settings.images[0]} alt="Shop" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
            </div>
          )}
          
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Description</p>
            <p style={{ fontSize: '1.05rem', fontWeight: 400, color: 'var(--dark)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{settings.description || 'Not Set'}</p>
          </div>

          <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-light)' }} />

          <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>Schedule & Availability</h4>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Working Days</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {workingDays.length > 0 ? workingDays.map(day => (
                <span key={day} className="badge badge-primary">{day}</span>
              )) : <span className="text-muted">Not Set</span>}
            </div>
          </div>

          <div>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Blocked Dates</p>
            {blockedDates.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {blockedDates.map((bd, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{new Date(bd.date).toLocaleDateString()}</span>
                    <span className="badge badge-warning">{bd.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>No blocked dates configured.</p>
            )}
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
              <Pencil size={16} style={{ marginRight: '0.5rem' }} /> Edit Shop Details
            </button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmitClick} className="admin-form card" style={{ padding: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}
        <div className="form-group">
          <label>Shop Name</label>
          <input type="text" name="shopName" value={settings.shopName} onChange={handleChange} required className="input-field" />
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
        
        <div className="form-group">
          <label>Shop Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            {settings.images && settings.images.length > 0 && (
              <img src={settings.images[0]} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="input-field" style={{ flex: 1 }} />
          </div>
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

        <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }} onClick={() => { fetchSettings(); setIsEditing(false); }} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      )}

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
