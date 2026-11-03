import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import GuestForm from './pages/GuestForm';
import GuestSuccess from './pages/GuestSuccess';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import PimpinanDashboard from './pages/PimpinanDashboard';
import GuestList from './pages/GuestList';
import IdentityDepositPage from './pages/IdentityDepositPage';
import SecurityBookPage from './pages/SecurityBookPage';
import ReportsPage from './pages/ReportsPage';
import AiAnalysisPage from './pages/AiAnalysisPage';
import MasterBuildingsPage from './pages/MasterBuildingsPage';
import MasterAreasPage from './pages/MasterAreasPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) {
    return <Navigate to="/guest-form" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'security') return <Navigate to="/security/dashboard" replace />;
  if (user.role === 'pimpinan') return <Navigate to="/pimpinan/dashboard" replace />;
  return <Navigate to="/guest-form" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Guest Registration & Success */}
          <Route path="/guest-form" element={<GuestForm />} />
          <Route path="/guest-success" element={<GuestSuccess />} />
          <Route path="/login" element={<Login />} />

          {/* Root Redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Routes */}
          <Route element={<Layout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/security/dashboard" element={<SecurityDashboard />} />
            <Route path="/pimpinan/dashboard" element={<PimpinanDashboard />} />

            <Route path="/guests" element={<GuestList />} />
            <Route path="/deposits" element={<IdentityDepositPage />} />
            <Route path="/security-book" element={<SecurityBookPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai-analysis" element={<AiAnalysisPage />} />

            <Route path="/admin/buildings" element={<MasterBuildingsPage />} />
            <Route path="/admin/areas" element={<MasterAreasPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
