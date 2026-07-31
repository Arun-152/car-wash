import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

import HomePage from './pages/customer/HomePage';
import ServiceDetailsPage from './pages/customer/ServiceDetailsPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

import MyVehiclesPage from './pages/customer/MyVehiclesPage';
import BookingPage from './pages/customer/BookingPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import PaymentSuccessPage from './pages/customer/PaymentSuccessPage';
import PaymentFailedPage from './pages/customer/PaymentFailedPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import MyBookingsDetailsPage from './pages/customer/MyBookingsDetailsPage';
// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAvailabilityPage from './pages/admin/AdminAvailabilityPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
const ProfilePage = () => {
  const { logout, user } = useContext(AuthContext);
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '4rem 2rem' }}>
        <h2>My Profile</h2>
        <div className="card" style={{ padding: '2rem', marginTop: '1rem' }}>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <button onClick={logout} className="btn btn-outline" style={{ marginTop: '1rem' }}>Logout</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

function AppRoutes() {
  const { user } = useContext(AuthContext);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services/:id" element={<ServiceDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer', 'admin']} />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-vehicles" element={<MyVehiclesPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/my-bookings/:id" element={<MyBookingsDetailsPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/booking-confirmation/:id" element={<BookingConfirmationPage />} />
          <Route path="/payment-success/:id" element={<PaymentSuccessPage />} />
          <Route path="/payment-failed/:id" element={<PaymentFailedPage />} />
        </Route>



        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="availability" element={<AdminAvailabilityPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
