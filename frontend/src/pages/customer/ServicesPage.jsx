import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getServices } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import './HomePage.css'; // Reuse card styles from home page

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        // Fetch more to allow client side filtering or use backend if available
        const data = await getServices({ page, limit: 10 });
        
        // Ensure we handle both paginated object or array just in case
        let loadedServices = [];
        if (data.services) {
          loadedServices = data.services.filter(s => s.isActive);
          setTotalPages(data.totalPages);
        } else {
          // Fallback if not paginated
          loadedServices = Array.isArray(data) ? data.filter(s => s.isActive) : [];
          setTotalPages(1);
        }
        setServices(loadedServices);
        setFilteredServices(loadedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [page]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredServices(services);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = services.filter(service => 
        service.serviceName.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  return (
    <div className="page-wrapper bg-light">
      {/* Search Header */}
      <section className="services-hero">
        <div className="container">
          <div className="section-header text-center">
            <h1 className="section-title">Our Premium Services</h1>
          </div>
          
          <div className="services-search-container">
            <div className="search-bar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search for a service... (e.g. Wash, Ceramic)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="services-search-input"
              />
            </div>
          </div>
          
          <p className="section-subtitle">Discover the perfect care package for your vehicle.</p>
        </div>
      </section>

      <section className="section bg-light" style={{ minHeight: '50vh', paddingTop: '2rem' }}>
        <div className="container">
          {loading ? (
            <div className="text-center" style={{ padding: '4rem 2rem' }}>Loading services...</div>
          ) : error ? (
            <div className="text-center" style={{ padding: '4rem 2rem', color: 'red' }}>{error}</div>
          ) : (
            <>
              <div className="services-grid">
                {filteredServices.map((service) => (
                  <div
                    key={service._id}
                    className="service-card glass-card card-hover"
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
              </div>
              
              {filteredServices.length === 0 && (
                <div className="empty-state text-center" style={{ padding: '4rem 0' }}>
                  <p style={{ color: 'var(--gray)', fontSize: '1.1rem' }}>No services found matching "{searchTerm}".</p>
                  <button className="btn btn-outline mt-3" onClick={() => setSearchTerm('')}>Clear Search</button>
                </div>
              )}
              
              {searchTerm === '' && totalPages > 1 && (
                <div style={{ marginTop: '3rem' }}>
                  <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={setPage} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
