import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import './CenterCard.css';

const CenterCard = ({ center }) => {
  const navigate = useNavigate();

  return (
    <div className="card card-hover">
      <div className="card-image-wrapper">
        <img src={center.image || center.images?.[0]} alt={center.name} className="card-image" />
        <div className="card-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} fill="currentColor" color="#eab308" /> {center.rating || '4.5'}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{center.name}</h3>
        <p className="card-location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={14} /> {center.location || `${center.address}, ${center.city}`}
        </p>
        
        <div className="card-services">
          {center.services.slice(0, 3).map((service, index) => (
            <span key={index} className="service-tag">{service}</span>
          ))}
          {center.services.length > 3 && <span className="service-tag">+{center.services.length - 3} more</span>}
        </div>
        
        <div className="card-footer">
          <div className="price-block">
            <span className="price-label">Starts at</span>
            <span className="price-amount">₹{center.startingPrice}</span>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/centers/${center.id}`)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterCard;
