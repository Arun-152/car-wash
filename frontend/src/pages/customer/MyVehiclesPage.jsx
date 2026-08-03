import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Car, Bike, Truck, Zap, MapPin } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getMyVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import './MyVehiclesPage.css';

const getVehicleIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('bike')) return <Bike size={24} />;
  if (t.includes('ev') || t.includes('electric')) return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <Car size={24} />
      <Zap size={14} style={{ position: 'absolute', top: -6, right: -6, fill: 'currentColor' }} />
    </div>
  );
  if (t.includes('suv')) return <Car size={24} />;
  if (t.includes('heavy') || t.includes('truck')) return <Truck size={24} />;
  return <Car size={24} />;
};

const MyVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);

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
    setErrors({ ...errors, [e.target.name]: '' });
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
    setErrors({});
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
    
    const newErrors = {};
    const vehicleNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/; // Standard Indian format roughly (e.g. MH01AB1234)
    
    if (!formData.vehicleNumber) newErrors.vehicleNumber = 'Vehicle number is required';
    else if (!vehicleNumberRegex.test(formData.vehicleNumber.replace(/-/g, ''))) newErrors.vehicleNumber = 'Invalid vehicle number format (e.g., MH01AB1234)';
    
    if (!formData.brand) newErrors.brand = 'Brand is required';
    if (!formData.model) newErrors.model = 'Model/Location is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingId) {
        setShowUpdateModal(true);
      } else {
        setShowAddModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const executeSubmit = async () => {
    try {
      if (editingId) {
        await updateVehicle(editingId, formData);
        toast.success('Vehicle updated successfully.');
      } else {
        await addVehicle(formData);
        toast.success('Vehicle added successfully.');
      }
      setIsFormOpen(false);
      setShowUpdateModal(false);
      setShowAddModal(false);
      fetchVehicles();
    } catch (err) {
      if (editingId) toast.error('Update failed.');
      setError(err.response?.data?.message || 'Failed to save vehicle');
      setShowUpdateModal(false);
      setShowAddModal(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteVehicleId(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      await deleteVehicle(deleteVehicleId);
      toast.success('Vehicle deleted successfully.');
      fetchVehicles();
    } catch (err) {
      toast.error('Delete failed.');
    } finally {
      setShowDeleteModal(false);
      setDeleteVehicleId(null);
    }
  };

  return (
    <div className="page-wrapper bg-light">
      <div className="container" style={{ padding: '2rem 1rem' }}>
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
                    placeholder="e.g. MH01AB1234"
                  />
                  {errors.vehicleNumber && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.vehicleNumber}</span>}
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
                  />
                  {errors.brand && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.brand}</span>}
                </div>
                
                <div className="form-group">
                  <label>Model</label>
                  <input 
                    type="text" 
                    name="model" 
                    value={formData.model} 
                    onChange={handleInputChange} 
                    placeholder="e.g. City"
                  />
                  {errors.model && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.model}</span>}
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
          <div className="vehicles-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vehicle-card">
                <div className="vc-header">
                  <div className="vc-icon-wrap">
                    {getVehicleIcon(vehicle.vehicleType)}
                  </div>
                  <div className="vc-company">
                    {vehicle.brand}
                  </div>
                </div>

                <div className="vc-body">
                  <div className="vc-row">
                    <span className="vc-label">Vehicle Number</span>
                    <span className="vc-value vc-number">{vehicle.vehicleNumber}</span>
                  </div>
                  <div className="vc-row">
                    <span className="vc-label">Location</span>
                    <span className="vc-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={16} color="#111827" />
                      {vehicle.model}
                    </span>
                  </div>
                  <div className="vc-row">
                    <span className="vc-label">Vehicle Type</span>
                    <span className="vc-badge">{vehicle.vehicleType}</span>
                  </div>
                </div>

                <div className="vc-footer">
                  <button className="vc-btn vc-btn--edit" onClick={() => handleOpenForm(vehicle)}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button className="vc-btn vc-btn--delete" onClick={() => handleDelete(vehicle._id)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showUpdateModal}
        title="Update Vehicle"
        message="Do you want to save these changes?"
        confirmText="Update"
        cancelText="Cancel"
        type="primary"
        onConfirm={executeSubmit}
        onCancel={() => setShowUpdateModal(false)}
      />

      <ConfirmModal 
        isOpen={showAddModal}
        title="Add Vehicle"
        message="Do you want to add this vehicle?"
        confirmText="Add Vehicle"
        cancelText="Cancel"
        type="primary"
        onConfirm={executeSubmit}
        onCancel={() => setShowAddModal(false)}
      />

      <ConfirmModal 
        isOpen={showDeleteModal}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={executeDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteVehicleId(null);
        }}
      />
    </div>
  );
};

export default MyVehiclesPage;
