import React, { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { getShopSettings } from '../../services/api';
import './Footer.css';

const Footer = () => {
  const [shop, setShop] = useState(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const data = await getShopSettings();
        setShop(data);
      } catch (err) {
        console.error('Failed to load shop info in footer', err);
      }
    };
    fetchShop();
  }, []);

  const shopName = shop?.businessName || 'Our Car Wash';

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Droplets size={24} color="var(--primary)" /> {shopName}
          </h3>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
            Professional cleaning, protection, and detailing services for your vehicle.
          </p>
        </div>
        
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/#services">Services</a></li>
            <li><a href="/book">Book a Wash</a></li>
            <li><a href="/my-bookings">My Bookings</a></li>
          </ul>
        </div>
        
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Phone: {shop?.phone || '+1 234 567 8900'}</p>
          <p>Email: {shop?.email || 'contact@example.com'}</p>
          <p>Address: {shop?.address || '123 Main Street'}, {shop?.city || 'City'}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {shopName}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
