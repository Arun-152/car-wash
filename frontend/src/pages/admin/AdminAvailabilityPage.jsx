import React, { useState, useEffect } from 'react';
import { getAvailability, updateAvailability } from '../../services/api';
import { Trash2, Plus } from 'lucide-react';
import './AdminPages.css';

const AdminAvailabilityPage = () => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [availability, setAvailability] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    maxSimultaneousBookings: 1,
    breakTimes: [],
    blockedDates: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [newBreak, setNewBreak] = useState({ startTime: '', endTime: '' });
  const [newBlockedDate, setNewBlockedDate] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const data = await getAvailability();
      if (data) {
        setAvailability({ ...availability, ...data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingDayChange = (day) => {
    const updatedDays = availability.workingDays.includes(day)
      ? availability.workingDays.filter(d => d !== day)
      : [...availability.workingDays, day];
    
    setAvailability({ ...availability, workingDays: updatedDays });
  };

  const handleMaxBookingsChange = (e) => {
    setAvailability({ ...availability, maxSimultaneousBookings: Number(e.target.value) });
  };

  const addBreakTime = () => {
    if (newBreak.startTime && newBreak.endTime) {
      setAvailability({
        ...availability,
        breakTimes: [...availability.breakTimes, { ...newBreak }]
      });
      setNewBreak({ startTime: '', endTime: '' });
    }
  };

  const removeBreakTime = (index) => {
    const updatedBreaks = availability.breakTimes.filter((_, i) => i !== index);
    setAvailability({ ...availability, breakTimes: updatedBreaks });
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !availability.blockedDates.includes(newBlockedDate)) {
      setAvailability({
        ...availability,
        blockedDates: [...availability.blockedDates, newBlockedDate]
      });
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (dateToRemove) => {
    const updatedDates = availability.blockedDates.filter(d => d !== dateToRemove);
    setAvailability({ ...availability, blockedDates: updatedDates });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateAvailability(availability);
      setMessage({ type: 'success', text: 'Availability updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update availability' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading availability...</div>;

  return (
    <div className="admin-page">
      <h2>Shop Availability</h2>
      <p>Configure when your shop is open and manage scheduling rules.</p>
      
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form card" style={{ padding: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
        
        <div className="form-group">
          <label>Working Days</label>
          <div className="checkbox-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {daysOfWeek.map(day => (
              <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={availability.workingDays.includes(day)}
                  onChange={() => handleWorkingDayChange(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label>Max Simultaneous Bookings</label>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>How many cars can you wash at the same time?</p>
          <input 
            type="number" 
            min="1" 
            value={availability.maxSimultaneousBookings} 
            onChange={handleMaxBookingsChange} 
            className="input-field" 
            style={{ maxWidth: '200px' }}
          />
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label>Break Times (Daily)</label>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>Add times when the shop is on break (e.g., Lunch).</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input 
              type="time" 
              value={newBreak.startTime} 
              onChange={(e) => setNewBreak({ ...newBreak, startTime: e.target.value })} 
              className="input-field" 
            />
            <input 
              type="time" 
              value={newBreak.endTime} 
              onChange={(e) => setNewBreak({ ...newBreak, endTime: e.target.value })} 
              className="input-field" 
            />
            <button type="button" onClick={addBreakTime} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Break
            </button>
          </div>

          {availability.breakTimes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {availability.breakTimes.map((br, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--light)', borderRadius: '4px', marginBottom: '0.5rem', maxWidth: '400px' }}>
                  <span>{br.startTime} - {br.endTime}</span>
                  <button type="button" onClick={() => removeBreakTime(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label>Blocked Dates (Holidays)</label>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>Select specific dates when the shop will be closed.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input 
              type="date" 
              value={newBlockedDate} 
              onChange={(e) => setNewBlockedDate(e.target.value)} 
              className="input-field" 
              style={{ maxWidth: '200px' }}
            />
            <button type="button" onClick={addBlockedDate} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Date
            </button>
          </div>

          {availability.blockedDates.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {availability.blockedDates.map((date, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'var(--light)', borderRadius: '20px', fontSize: '0.875rem' }}>
                  <span>{new Date(date).toLocaleDateString()}</span>
                  <button type="button" onClick={() => removeBlockedDate(date)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '2rem' }}>
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </form>
    </div>
  );
};

export default AdminAvailabilityPage;
