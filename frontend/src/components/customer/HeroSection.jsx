import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching in:", location);
    // Future API call to redirect to search results
  };

  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container hero-content">
        <h1>Book Your Car Wash in <span className="highlight">Minutes</span></h1>
        <p>Premium car care delivered to your neighborhood. Find top-rated centers, pick a slot, and relax.</p>
        
        <form className="hero-search" onSubmit={handleSearch}>
          <div className="search-input">
            <MapPin size={20} color="var(--secondary)" />
            <input 
              type="text" 
              placeholder="Enter your city or location..." 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;
