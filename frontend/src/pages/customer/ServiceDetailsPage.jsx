import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import './HomePage.css'; // Reuse existing styles for cards

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const data = await getServiceById(id);
        setService(data);
      } catch (err) {
        console.error('Error fetching service:', err);
        setError('Service not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        Loading service details...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'red' }}>
        {error || 'Service not found'}
      </div>
    );
  }

  return (
    <div className="homepage-wrapper">
      
      <section className="section bg-light" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto', overflow: 'hidden' }}>
            {service.imageUrl && (
              <div style={{ width: '100%', height: '300px', overflow: 'hidden' }}>
                <img 
                  src={service.imageUrl} 
                  alt={service.serviceName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--dark)' }}>{service.serviceName}</h1>
                <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  {service.isActive ? 'Available' : 'Currently Unavailable'}
                </span>
              </div>
              
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--dark)', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem' }}>
                  Service Details & Benefits
                </h3>
                <p style={{ fontSize: '1.125rem', color: 'var(--gray)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {service.description}
                </p>
                <ul style={{ marginTop: '1.5rem', listStyle: 'none', padding: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', color: 'var(--dark)' }}>
                    <span style={{ color: 'var(--primary)', marginRight: '10px', fontSize: '1.25rem' }}>✓</span>
                    Professional-grade equipment and products
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', color: 'var(--dark)' }}>
                    <span style={{ color: 'var(--primary)', marginRight: '10px', fontSize: '1.25rem' }}>✓</span>
                    Trained and experienced detailing staff
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', color: 'var(--dark)' }}>
                    <span style={{ color: 'var(--primary)', marginRight: '10px', fontSize: '1.25rem' }}>✓</span>
                    Guaranteed customer satisfaction
                  </li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'var(--light)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <small style={{ color: 'var(--gray)', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Duration</small>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--dark)' }}>{service.duration} mins</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--gray)', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Price</small>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>₹{service.price}</strong>
                </div>
                {service.vehicleType && (
                  <div>
                    <small style={{ color: 'var(--gray)', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Vehicle Type</small>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--dark)', textTransform: 'capitalize' }}>{service.vehicleType}</strong>
                  </div>
                )}
              </div>

              {service.isActive ? (
                <button 
                  className="btn btn-primary btn-large w-100" 
                  onClick={() => navigate('/book', { state: { selectedService: service._id } })}
                  style={{ fontSize: '1.25rem', padding: '1rem' }}
                >
                  Book Now
                </button>
              ) : (
                <button 
                  className="btn btn-outline w-100" 
                  disabled
                  style={{ fontSize: '1.25rem', padding: '1rem', opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Service Unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetailsPage;
