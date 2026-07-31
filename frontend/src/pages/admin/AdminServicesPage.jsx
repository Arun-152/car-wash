import React, { useState, useEffect } from 'react';
import { getServices, addService, updateService, deleteService } from '../../services/api';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import './AdminPages.css';

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    price: '',
    duration: '',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setCurrentService(service);
      setFormData({
        serviceName: service.serviceName,
        description: service.description,
        price: service.price,
        duration: service.duration,
        isActive: service.isActive
      });
    } else {
      setCurrentService(null);
      setFormData({
        serviceName: '',
        description: '',
        price: '',
        duration: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentService) {
        await updateService(currentService._id, formData);
      } else {
        await addService(formData);
      }
      fetchServices();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving service');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
        fetchServices();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting service');
      }
    }
  };

  if (loading) return <div>Loading services...</div>;

  return (
    <div className="admin-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Manage Services</h2>
          <p>Add, edit, or remove services offered by the shop.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Add Service
        </button>
      </div>

      <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {services.map(service => (
          <div key={service._id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{service.serviceName}</h3>
              <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', flex: 1, whiteSpace: 'pre-wrap' }}>{service.description}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0', padding: '1rem 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <small style={{ color: 'var(--gray)', display: 'block' }}>Price</small>
                <strong>₹{service.price}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--gray)', display: 'block' }}>Duration</small>
                <strong>{service.duration} mins</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => handleOpenModal(service)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Edit2 size={16} /> Edit
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(service._id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && <p>No services found. Add your first service!</p>}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{currentService ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Service Name</label>
                <input type="text" name="serviceName" value={formData.serviceName} onChange={handleChange} required className="input-field" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required className="input-field" rows="3"></textarea>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price (₹)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required className="input-field" min="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Duration (mins)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleChange} required className="input-field" min="15" step="15" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="isActive" />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Service is Active and Available for Booking</label>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{currentService ? 'Save Changes' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServicesPage;
