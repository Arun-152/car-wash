import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatName = (name, index, pathnames) => {
    const map = {
      'my-bookings': 'My Bookings',
      'my-vehicles': 'My Vehicles',
      'book': 'Book a Wash',
      'booking-confirmation': 'Booking Confirmation',
      'payment-success': 'Payment Success',
      'payment-failed': 'Payment Failed',
      'services': 'Services',
      'wallet': 'Wallet',
      'profile': 'Profile',
    };
    
    if (map[name]) return map[name];
    
    // Check if it's an ID (typically 24 char hex in MongoDB)
    if (/^[0-9a-fA-F]{24}$/.test(name) || /^\d+$/.test(name)) {
      if (pathnames[index - 1] === 'my-bookings') {
        return 'Booking Details';
      }
      return 'Details';
    }
    
    // Fallback formatter
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={15} className="breadcrumb-icon" />
            Home
          </Link>
        </li>
        {pathnames.length > 0 && (
          <li className="breadcrumb-separator-container">
            <ChevronRight size={14} className="breadcrumb-separator" />
          </li>
        )}
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const formattedName = formatName(value, index, pathnames);

          return (
            <React.Fragment key={to}>
              <li className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {isLast ? (
                  <span className="breadcrumb-current">{formattedName}</span>
                ) : (
                  <Link to={to} className="breadcrumb-link">
                    {formattedName}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li className="breadcrumb-separator-container">
                  <ChevronRight size={14} className="breadcrumb-separator" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
