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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#fef2f2', minHeight: '100vh', color: '#991b1b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Terjadi Kesalahan di Frontend</h2>
          <pre style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fecaca', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.href = '/guest-form'; }} style={{ marginTop: 16, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Reset & Ke Form Tamu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #cbd5e1', borderTopColor: '#047857', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Memuat sistem buku tamu...</p>
        </div>
      </div>
    );
  }

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
