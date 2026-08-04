import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

import HomePage from './pages/customer/HomePage';
import ServicesPage from './pages/customer/ServicesPage';
import ServiceDetailsPage from './pages/customer/ServiceDetailsPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import VerifyOTPPage from './pages/public/VerifyOTPPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

import MyVehiclesPage from './pages/customer/MyVehiclesPage';
import BookingPage from './pages/customer/BookingPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import PaymentSuccessPage from './pages/customer/PaymentSuccessPage';
import PaymentFailedPage from './pages/customer/PaymentFailedPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import MyBookingsDetailsPage from './pages/customer/MyBookingsDetailsPage';
import WalletPage from './pages/customer/WalletPage';
import UserSidebar from './components/customer/UserSidebar';
import { Outlet } from 'react-router-dom';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

import AdminAvailabilityPage from './pages/admin/AdminAvailabilityPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import { toast } from 'react-toastify';
import ConfirmModal from './components/common/ConfirmModal';
import { useState } from 'react';
import ProfilePage from './pages/customer/ProfilePage';



const AppLayout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const hideSidebarRoutes = ['/', '/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname) || location.pathname.startsWith('/reset-password');
  
  const hideFooterRoutes = ['/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  const showSidebar = user && user.role === 'customer' && !shouldHideSidebar;

  return (
    <div className="app-page-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="app-main-layout" style={{ display: 'flex', flex: 1, backgroundColor: '#f8fafc' }}>
        {showSidebar && <UserSidebar />}
        <div className="app-content-area" style={{ flex: 1, overflowX: 'hidden', paddingBottom: shouldHideFooter ? '0' : '2rem' }}>
          <Outlet />
        </div>
      </div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            <Route path="/wallet" element={<WalletPage />} />
          </Route>
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />



        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />

            <Route path="availability" element={<AdminAvailabilityPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
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
      <ToastContainer position="top-right" autoClose={3000} limit={1} />
    </AuthProvider>
  );
}

export default App;
