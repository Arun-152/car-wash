import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getServices } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import './HomePage.css'; // Reuse card styles from home page

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getServices({ page, limit: 5 });
        
        // Ensure we handle both paginated object or array just in case
        if (data.services) {
          setServices(data.services.filter(s => s.isActive));
          setTotalPages(data.totalPages);
        } else {
          // Fallback if not paginated
          setServices(Array.isArray(data) ? data.filter(s => s.isActive) : []);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [page]);

  return (
    <div className="page-wrapper bg-light">

      <section className="section bg-light" style={{ minHeight: '70vh' }}>
        <div className="container" style={{ paddingTop: '2rem' }}>
          <div className="section-header text-center">
            <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Services</h1>
            <p className="section-subtitle">Browse all our professional car care services.</p>
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: '4rem 2rem' }}>Loading services...</div>
          ) : error ? (
            <div className="text-center" style={{ padding: '4rem 2rem', color: 'red' }}>{error}</div>
          ) : (
            <>
              <div className="services-grid">
                {services.map((service) => (
                  <div
                    key={service._id}
                    className="service-card card"
                    onClick={() => navigate(`/services/${service._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {service.imageUrl && (
                      <div className="service-image">
                        <img src={service.imageUrl} alt={service.serviceName} />
                      </div>
                    )}
                    <div className="service-content">
                      <h3>{service.serviceName}</h3>
                      <p className="service-desc" style={{ whiteSpace: 'pre-wrap' }}>{service.description}</p>

                      <div className="service-meta">
                        <div className="meta-item">
                          <span className="meta-label">Duration:</span>
                          <span className="meta-value">{service.duration} mins</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Starting from</span>
                          <span className="meta-price">₹{service.price}</span>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary w-100 mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/book', { state: { selectedService: service._id } });
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-center w-100" style={{ color: 'var(--gray)' }}>No active services available at the moment.</p>
                )}
              </div>
              
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
