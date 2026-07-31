import React, { useState, useEffect } from 'react';
import { getShopSettings, updateShopSettings } from '../../services/api';
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getShopSettings();
      if (data) {
        setSettings({ ...settings, ...data });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateShopSettings(settings);
      setMessage({ type: 'success', text: 'Shop settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="admin-page">
      <h2>Shop Settings</h2>
      <p>Configure your shop details here. These details will be displayed to customers.</p>
      
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form card" style={{ padding: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
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

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
