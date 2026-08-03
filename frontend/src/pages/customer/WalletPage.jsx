import React, { useState, useEffect, useContext } from 'react';
import { Wallet, Search, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { getWalletHistory } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import './WalletPage.css';

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0, totalRefunds: 0 });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getWalletHistory({
          page,
          limit: 5,
          type: activeTab,
          search: searchTerm
        });
        
        if (data.transactions) {
          setTransactions(data.transactions);
          setTotalPages(data.totalPages);
          if (data.summary) {
            setSummary(data.summary);
          }
        } else {
          setTransactions(Array.isArray(data) ? data : []);
          setTotalPages(1);
        }
      } catch (err) {
        setError('Failed to load wallet history.');
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce fetch slightly if typing in search
    const delayDebounceFn = setTimeout(() => {
      if (user) fetchHistory();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [user, page, activeTab, searchTerm]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="wallet-page-wrapper">
      <div className="container">
        
        <div className="wallet-page-header">
          <h2>My Wallet</h2>
          <p>Manage your balance and view detailed transaction history.</p>
        </div>

        <div className="wallet-top-cards">
          <div className="wallet-balance-card">
            <div>
              <h3>Available Balance</h3>
              <div className="wallet-balance-amount">₹{user?.walletBalance || 0}</div>
            </div>
            <Wallet size={80} strokeWidth={1} style={{ opacity: 0.8 }} />
          </div>

          <div className="wallet-stats-grid">
            <div className="wallet-stat-card">
              <div className="stat-icon refund"><RefreshCw size={20} /></div>
              <div className="stat-label">Total Refunds</div>
              <div className="stat-val">₹{summary.totalRefunds}</div>
            </div>
            <div className="wallet-stat-card">
              <div className="stat-icon credit"><ArrowDownRight size={20} /></div>
              <div className="stat-label">Total Credits</div>
              <div className="stat-val">₹{summary.totalCredits}</div>
            </div>
            <div className="wallet-stat-card">
              <div className="stat-icon debit"><ArrowUpRight size={20} /></div>
              <div className="stat-label">Total Debits</div>
              <div className="stat-val">₹{summary.totalDebits}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Transaction History</h3>
          
          <div className="wallet-filters">
            <div className="filter-tabs">
              {['All', 'Credits', 'Debits', 'Refunds'].map(tab => {
                const typeVal = tab === 'Credits' ? 'Credit' : tab === 'Debits' ? 'Debit' : tab === 'Refunds' ? 'Refund' : 'All';
                return (
                  <button 
                    key={tab} 
                    className={`filter-tab ${activeTab === typeVal ? 'active' : ''}`}
                    onClick={() => handleTabChange(typeVal)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            <div className="wallet-search">
              <Search size={18} color="var(--gray)" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray)' }}>Loading transactions...</div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="tx-empty-state">
              <Wallet size={48} />
              <h3>No Transactions Found</h3>
              <p>Looks like you don't have any transactions matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="wallet-table-container">
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction ID</th>
                      <th>Booking Ref</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const type = tx.type?.toLowerCase() || '';
                      const isCredit = type === 'credit' || type === 'refund';
                      
                      return (
                        <tr key={tx._id}>
                          <td>{formatDate(tx.createdAt || tx.date)}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: 'var(--gray)' }}>{tx._id.substring(0, 8)}...</span>
                          </td>
                          <td>{tx.referenceId ? <span style={{ fontFamily: 'monospace' }}>{tx.referenceId.substring(0, 8)}</span> : '-'}</td>
                          <td>{tx.description}</td>
                          <td>
                            <span className={`tx-badge ${type}`}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </td>
                          <td className={`tx-amount ${isCredit ? 'credit' : 'debit'}`}>
                            {isCredit ? '+' : '-'}₹{tx.amount}
                          </td>
                          <td>
                            <span style={{ color: '#16a34a', fontWeight: 500, fontSize: '0.875rem' }}>Completed</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default WalletPage;
