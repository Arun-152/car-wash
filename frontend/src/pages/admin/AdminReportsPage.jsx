import React, { useState, useEffect } from 'react';
import { getAdminReports, getServices } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, FileText, Filter, Calendar } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import './AdminPages.css';

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ summary: {}, bookings: [] });
  const [services, setServices] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [filters, setFilters] = useState({
    timeRange: 'month',
    startDate: '',
    endDate: '',
    serviceId: 'all',
    status: 'all'
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [filters.timeRange, filters.serviceId, filters.status, page]);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await getAdminReports({ ...filters, page, limit: 5 });
      setReportData(data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (filters.timeRange === 'custom') {
      setPage(1);
      fetchReportData();
    }
  };

  const handleExportPDFClick = () => {
    setShowDownloadModal(true);
  };

  const handleExportPDF = () => {
    setShowDownloadModal(false);
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Shop Name - Business Report', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Report Summary', 14, 45);

    doc.setFontSize(11);
    doc.text(`Total Bookings: ${reportData.summary.totalBookings}`, 14, 55);
    doc.text(`Completed Bookings: ${reportData.summary.completedBookings}`, 80, 55);

    doc.text(`Cancelled Bookings: ${reportData.summary.cancelledBookings}`, 14, 63);
    doc.text(`Manual Bookings: ${reportData.summary.manualBookings}`, 80, 63);
    doc.text(`Most Booked Service: ${reportData.summary.mostBookedService}`, 150, 63);

    doc.setFontSize(12);
    doc.setTextColor(20, 184, 166); // teal-like color for revenue
    doc.text(`Total Revenue: INR ${reportData.summary.totalRevenue}`, 14, 73);
    doc.text(`Avg Booking Value: INR ${reportData.summary.avgBookingValue}`, 80, 73);

    // Table Data
    const tableColumn = ["ID", "Customer", "Service", "Vehicle", "Date", "Time", "Amount", "Status", "Payment"];
    const tableRows = [];

    reportData.bookings.forEach(booking => {
      const bookingData = [
        booking._id.substring(0, 8),
        booking.userId?.name || 'N/A',
        booking.serviceId?.serviceName || 'N/A',
        booking.vehicleId?.vehicleNumber || 'N/A',
        new Date(booking.bookingDate).toLocaleDateString(),
        booking.startTime,
        `INR ${booking.totalAmount}`,
        booking.bookingStatus,
        booking.paymentStatus
      ];
      tableRows.push(bookingData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${String(i)} of ${String(pageCount)}`, doc.internal.pageSize.width / 2, 287, { align: 'center' });
    }

    doc.save('car_wash_report.pdf');
    toast.success('Report downloaded successfully.');
  };

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Customer Name', 'Service', 'Vehicle', 'Booking Date', 'Time', 'Amount', 'Payment Method', 'Booking Status', 'Payment Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    reportData.bookings.forEach(b => {
      const values = [
        b._id,
        `"${b.userId?.name || 'N/A'}"`,
        `"${b.serviceId?.serviceName || 'N/A'}"`,
        `"${b.vehicleId?.vehicleNumber || 'N/A'}"`,
        new Date(b.bookingDate).toLocaleDateString(),
        b.startTime,
        b.totalAmount,
        b.paymentMethod,
        b.bookingStatus,
        b.paymentStatus
      ];
      csvRows.push(values.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'bookings_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <div className="admin-page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Business Reports & Analytics</h2>
          <p>Export financial data and analyze shop performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <FileText size={18} /> Export CSV
          </button>
            <button className="btn btn-primary" onClick={handleExportPDFClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} />
              Export PDF
            </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Report Filters</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                <label className="filter-label">Time Range</label>
                <select
                  className="filter-select"
                  value={filters.timeRange}
                  onChange={(e) => { setFilters({ ...filters, timeRange: e.target.value }); setPage(1); }}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {filters.timeRange === 'custom' && (
                <form onSubmit={handleCustomDateSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div className="filter-group">
                    <label className="filter-label">Start</label>
                    <input type="date" className="filter-select" value={filters.startDate} onChange={e => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} required />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">End</label>
                    <input type="date" className="filter-select" value={filters.endDate} onChange={e => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} required />
                  </div>
                  <button type="submit" className="btn btn-outline" style={{ height: '38px', padding: '0 1rem' }}>Apply</button>
                </form>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div className="filter-group">
                <label className="filter-label">Service</label>
                <select
                  className="filter-select"
                  value={filters.serviceId}
                  onChange={(e) => { setFilters({ ...filters, serviceId: e.target.value }); setPage(1); }}
                >
                  <option value="all">All Services</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.serviceName}</option>)}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filters.timeRange === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Apply Dates</button>
          </form>
        )}
      </div>

      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.875rem' }}>Total Bookings</p>
              <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{reportData.summary.totalBookings || 0}</h3>
            </div>

            <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.875rem' }}>Completed Bookings</p>
              <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{reportData.summary.completedBookings || 0}</h3>
            </div>
            <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.875rem' }}>Cancelled Bookings</p>
              <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{reportData.summary.cancelledBookings || 0}</h3>
            </div>
            <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.875rem' }}>Manual Bookings</p>
              <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{reportData.summary.manualBookings || 0}</h3>
            </div>
            <div className="card" style={{ borderTop: '4px solid #14b8a6', gridColumn: 'span 2' }}>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.875rem' }}>Total Revenue</p>
              <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>₹{reportData.summary.totalRevenue || 0}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--gray)' }}>Avg Booking Value: ₹{reportData.summary.avgBookingValue || 0}</span>
                <span style={{ color: 'var(--gray)' }}>Top Service: {reportData.summary.mostBookedService || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ margin: 0 }}>Booking Report Data</h3>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Vehicle</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Pay Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.bookings.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No bookings found for these filters.</td></tr>
                  ) : (
                    reportData.bookings.map(b => (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b._id.substring(0, 8)}</td>
                        <td>{b.userId?.name || 'N/A'}</td>
                        <td>{b.serviceId?.serviceName || 'N/A'}</td>
                        <td>{b.vehicleId?.vehicleNumber || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span>{new Date(b.bookingDate).toLocaleDateString()}</span>
                            <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>{b.startTime}</span>
                          </div>
                        </td>
                        <td>₹{b.totalAmount}</td>
                        <td>{b.paymentMethod?.toUpperCase()}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className={`badge ${b.bookingStatus === 'completed' ? 'badge-success' :
                              b.bookingStatus === 'cancelled' ? 'badge-danger' :
                                'badge-warning'
                              }`}>
                              {b.bookingStatus}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{b.paymentStatus}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </>
      )}

      <ConfirmModal 
        isOpen={showDownloadModal}
        title="Download Report"
        message="Do you want to download this report?"
        confirmText="Download"
        cancelText="Cancel"
        type="primary"
        onConfirm={handleExportPDF}
        onCancel={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default AdminReportsPage;
