import React, { useState, useEffect } from 'react';
import { getServices, addService, updateService, deleteService } from '../../services/api';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import './AdminPages.css';

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, id: null });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    price: '',
    duration: '',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, [page]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getServices({ page, limit: 5 });
      if (data.services) {
        setServices(data.services);
        setTotalPages(data.totalPages);
      } else {
        setServices(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({ show: true, action: currentService ? 'edit' : 'add', id: currentService?._id });
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ show: true, action: 'delete', id });
  };

  const executeAction = async () => {
    const { action, id } = confirmModal;
    
    try {
      if (action === 'delete') {
        await deleteService(id);
        toast.success('Service deleted successfully.');
        fetchServices();
      } else if (action === 'edit') {
        await updateService(id, formData);
        toast.success('Service updated successfully.');
        fetchServices();
        handleCloseModal();
      } else if (action === 'add') {
        await addService(formData);
        toast.success('Service added successfully.');
        setPage(1);
        fetchServices();
        handleCloseModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setConfirmModal({ show: false, action: null, id: null });
    }
  };

  const getModalConfig = () => {
    switch (confirmModal.action) {
      case 'add': return { title: 'Add Service', message: 'Do you want to add this service?', confirmText: 'Add Service', type: 'primary' };
      case 'edit': return { title: 'Update Service', message: 'Do you want to save these service changes?', confirmText: 'Update', type: 'primary' };
      case 'delete': return { title: 'Delete Service', message: 'Are you sure you want to delete this service?', confirmText: 'Delete', type: 'danger' };
      default: return {};
    }
  };

  const modalConfig = getModalConfig();

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

      {loading ? (
        <div>Loading services...</div>
      ) : (
        <>
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
                  <button className="btn btn-outline btn-sm" onClick={() => handleDeleteClick(service._id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && <p>No services found. Add your first service!</p>}
          </div>
          
          {services.length > 0 && (
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

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
                <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Service is Active (Available for booking)</label>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{currentService ? 'Save Changes' : 'Add Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <ConfirmModal 
          isOpen={confirmModal.show}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText="Cancel"
          type={modalConfig.type}
          onConfirm={executeAction}
          onCancel={() => setConfirmModal({ show: false, action: null, id: null })}
        />
      )}
    </div>
  );
};

export default AdminServicesPage;
