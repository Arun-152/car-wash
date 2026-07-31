import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const PaymentSuccessPage = () => {
  const { id } = useParams();

  return (
    <div className="page-wrapper bg-light">
      <Navbar />
      <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh'}}>
        <div className="card" style={{padding:'4rem', textAlign:'center', maxWidth:'600px', width: '100%'}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom:'1rem', color: '#10b981'}}><CheckCircle size={64} /></div>
          <h2 style={{color:'#16a34a', marginBottom:'1rem'}}>Payment Successful!</h2>
          <p style={{color:'var(--gray)', marginBottom:'2rem', fontSize:'1.125rem'}}>
            Your car wash appointment has been confirmed. 
            We have received your payment securely.
          </p>
          <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
            <Link to={`/my-bookings/${id}`} className="btn btn-primary">View Booking Details</Link>
            <Link to="/home" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
