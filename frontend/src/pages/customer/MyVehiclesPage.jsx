import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Car } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getMyVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../services/api';
import './MyVehiclesPage.css';

const MyVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    brand: '',
    model: ''
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await getMyVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenForm = (vehicle = null) => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        brand: vehicle.brand,
        model: vehicle.model
      });
      setEditingId(vehicle._id);
    } else {
      setFormData({ vehicleNumber: '', vehicleType: 'car', brand: '', model: '' });
      setEditingId(null);
    }
    setError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const vehicleNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/; // Standard Indian format roughly (e.g. MH01AB1234)
    if (!formData.vehicleNumber) {
      return setError('Vehicle number is required');
    }
    if (!vehicleNumberRegex.test(formData.vehicleNumber)) {
      return setError('Invalid vehicle number format (e.g., MH01AB1234)');
    }

    try {
      if (editingId) {
        await updateVehicle(editingId, formData);
      } else {
        await addVehicle(formData);
      }
      setIsFormOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        fetchVehicles();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete vehicle');
      }
    }
  };

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      
      <div className="container vehicles-container">
        <div className="vehicles-header">
          <h2>My Vehicles</h2>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            + Add New Vehicle
          </button>
        </div>

        {error && !isFormOpen && <div className="error-message">{error}</div>}

        {isFormOpen && (
          <div className="vehicle-form-card card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input 
                    type="text" 
                    name="vehicleNumber" 
                    value={formData.vehicleNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g. MH-01-AB-1234"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} required>
                    <option value="car">Car</option>
                    <option value="suv">SUV</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Brand</label>
                  <input 
                    type="text" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Honda"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Model</label>
                  <input 
                    type="text" 
                    name="model" 
                    value={formData.model} 
                    onChange={handleInputChange} 
                    placeholder="e.g. City"
                    required 
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Vehicle' : 'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading vehicles...</div>
        ) : !isFormOpen && vehicles.length === 0 ? (
          <div className="empty-state card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No Vehicles Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>You haven't added any vehicles yet. Click the button above to add one.</p>
          </div>
        ) : !isFormOpen && (
          <div className="vehicles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vehicle-card card card-hover" style={{ padding: '1.5rem', position: 'relative' }}>
                <div className="vehicle-icon" style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                  <Car size={32} />
                </div>
                <div className="vehicle-details">
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{vehicle.brand} {vehicle.model}</h4>
                  <p className="vehicle-number" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{vehicle.vehicleNumber}</p>
                  <span className="badge badge-neutral">{vehicle.vehicleType}</span>
                </div>
                <div className="vehicle-actions" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => handleOpenForm(vehicle)}><Edit2 size={16} /></button>
                  <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(vehicle._id)}><Trash2 size={16} /></button>
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

export default MyVehiclesPage;
