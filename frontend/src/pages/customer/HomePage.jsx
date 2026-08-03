import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getShopSettings, getServices, getPublicAvailability } from '../../services/api';
import './HomePage.css';

const to12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hNum = parseInt(h, 10);
  const suffix = hNum >= 12 ? 'PM' : 'AM';
  const hours = hNum % 12 || 12;
  return `${hours}:${m} ${suffix}`;
};

const mockReviews = [
  { id: 1, name: '— Rahul, Kottakkal', comment: 'Service super ayirunnu. Booking process valare easy aanu. Staff nalla friendly aanu.', rating: 5 },
  { id: 2, name: '— Anjali, Malappuram', comment: 'Car full clean ayi kitti. Time correct ayi delivery cheythu. Highly recommended.', rating: 5 },
  { id: 3, name: '— Nikhil, Perinthalmanna', comment: 'Ceramic coating quality valare nannayirunnu. Worth the money.', rating: 5 },
  { id: 4, name: '— Fathima, Tirur', comment: 'Professional service. Booking muthal delivery vare nalla experience ayirunnu.', rating: 5 },
  { id: 5, name: '— Asif, Kottakkal', comment: 'Vehicle pickup and wash quality super. Ini eppozhum ivide thanne book cheyyum.', rating: 5 }
];

const HomePage = () => {
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shopData, servicesData, avData] = await Promise.all([
          getShopSettings(),
          getServices({ limit: 3 }),
          getPublicAvailability()
        ]);
        setShop(shopData);
        setServices(servicesData.filter(s => s.isActive));
        setAvailability(avData);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage-wrapper">
        <Navbar />
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'red' }}>
          {error}
        </div>
        <Footer />
      </div>
    );
  }

  const shopName = shop?.businessName || 'Our Car Wash';

  return (
    <div className="homepage-wrapper">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content text-center">
          <h1>Professional Car Care Services</h1>
          <p>Experience the best cleaning, detailing, and protection for your vehicle.</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/book')}>Book an Appointment</button>
        </div>
      </section>

      {/* Services Section */}
      <section className="section bg-light" id="services">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Our Car Care Services</h2>
            <p className="section-subtitle">Professional cleaning, protection, and detailing services for your vehicle.</p>
          </div>

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
          
          <div className="text-center" style={{ marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/services')}>See All Services</button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-white" id="why-choose-us">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Why Choose Us</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Professional Car Care</h3>
              <p>Experienced service and careful attention to every vehicle.</p>
            </div>
            <div className="feature-card">
              <h3>Quality Products</h3>
              <p>Use quality cleaning and detailing products appropriate for automotive surfaces.</p>
            </div>
            <div className="feature-card">
              <h3>Convenient Booking</h3>
              <p>Customers can select their service, date, and available time online.</p>
            </div>
            <div className="feature-card">
              <h3>Transparent Pricing</h3>
              <p>Service prices are clearly displayed before booking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-light" id="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Book Your Car Wash in Four Simple Steps</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Choose a Service</h3>
              <p>Select the car washing or detailing service your vehicle needs.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Select Your Vehicle</h3>
              <p>Choose one of your saved vehicles.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Choose Date & Time</h3>
              <p>Select an available appointment.</p>
            </div>
            <div className="step-card">
              <div className="step-number">04</div>
              <h3>Confirm Your Booking</h3>
              <p>Review your booking and complete payment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Clean Wash & Contact Location */}
      <section className="section bg-white" id="about">
        <div className="container">
          <div className="about-contact-layout">
            <div className="about-section">
              <h2 className="section-title">About {shop?.shopName || 'Clean Wash'}</h2>
              <h3>{shop?.shopName || 'Clean Wash'}</h3>
              <p className="about-description">
                {shop?.description || 'Information about the shop is currently not available.'}
              </p>
              <div className="shop-details-list">
                <div className="detail-item">
                  <strong>Working Hours:</strong> {shop?.openingTime ? `${to12h(shop.openingTime)} - ${to12h(shop.closingTime)}` : 'Not Available'}
                </div>
                <div className="detail-item mt-2">
                  <strong>Working Days:</strong> {availability?.workingDays?.length > 0 ? availability.workingDays.join(', ') : 'Not Available'}
                </div>
              </div>
            </div>
            <div className="contact-section card" style={{ padding: '0', overflow: 'hidden' }}>
              {shop?.images && shop.images.length > 0 && (
                <img src={shop.images[0]} alt="Shop" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              )}
              <div style={{ padding: '2rem' }}>
                <h3>Contact & Location</h3>
                <div className="contact-details">
                  <p><strong>{shop?.shopName || 'Clean Wash'}</strong></p>
                  <p>{shop?.address }</p>
                  <p className="mt-3"><strong>Phone:</strong> {shop?.phone || 'Not Available'}</p>
                  <p><strong>Email:</strong> {shop?.email || 'Not Available'}</p>
                </div>
                <a href={`https://maps.google.com/?q=${shop?.address || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-100 mt-4">
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="section bg-light" id="reviews">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Customer Reviews</h2>
          </div>
          <div className="reviews-grid">
            {mockReviews.map((review) => (
              <div key={review.id} className="review-card card">
                <div className="rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="review-comment">"{review.comment}"</p>
                <p className="review-author">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
