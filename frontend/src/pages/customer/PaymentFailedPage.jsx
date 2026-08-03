import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const PaymentFailedPage = () => {
  const { id } = useParams();

  return (
    <div className="page-wrapper bg-light">
      <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh'}}>
        <div className="card" style={{padding:'4rem', textAlign:'center', maxWidth:'600px', width: '100%'}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom:'1rem', color: '#ef4444'}}><XCircle size={64} /></div>
          <h2 style={{color:'#dc2626', marginBottom:'1rem'}}>Payment Failed or Cancelled</h2>
          <p style={{color:'var(--gray)', marginBottom:'2rem', fontSize:'1.125rem'}}>
            We couldn't process your payment. Your booking has been saved as 'pending' but the time slot is not fully secured until payment is completed.
          </p>
          <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
            <Link to={`/my-bookings/${id}`} className="btn btn-primary">Try Payment Again</Link>
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
