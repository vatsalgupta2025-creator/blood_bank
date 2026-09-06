import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import TopHeader from './components/TopHeader';
import DashboardPage      from './pages/DashboardPage';
import BloodBanksPage     from './pages/BloodBanksPage';
import DonorsPage         from './pages/DonorsPage';
import ReceiversPage      from './pages/ReceiversPage';
import BloodUnitsPage     from './pages/BloodUnitsPage';
import BloodRequestsPage  from './pages/BloodRequestsPage';
import BloodTestsPage     from './pages/BloodTestsPage';
import DonationEventsPage from './pages/DonationEventsPage';
import StaffPage          from './pages/StaffPage';
import LoadingScreen      from './components/LoadingScreen';
import LoginPage          from './pages/LoginPage';
import LandingPage        from './pages/LandingPage';
import { setToken }       from './api';

function PageLayout({ title, subtitle, children }) {
  return (
    <>
      <header className="topbar">
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
        <div className="topbar-right">
          <span style={{
            fontSize: 12, color: 'var(--text-muted)',
            background: 'rgba(220,20,60,0.08)',
            border: '1px solid rgba(220,20,60,0.15)',
            padding: '4px 10px', borderRadius: 'var(--radius-full)'
          }}>
            🩸 Live
          </span>
        </div>
      </header>
      <main className="page-wrapper" id="main-content" style={{ padding: '24px' }}>
        {children}
      </main>
    </>
  );
}

function ProtectedLayout({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <TopHeader />
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bb_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setToken(parsed.token);
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  if (isLoading) {
    return <LoadingScreen onDone={() => setIsLoading(false)} />;
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={
            !user ? <LoginPage onLogin={(u) => setUser(u)} /> : <Navigate to="/dashboard" replace />
          } />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout user={user} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/blood-banks" element={
              <PageLayout title="Blood Banks" subtitle="Manage blood bank facilities">
                <BloodBanksPage />
              </PageLayout>
            } />
            <Route path="/donors" element={
              <PageLayout title="Donors" subtitle="Registered blood donors">
                <DonorsPage />
              </PageLayout>
            } />
            <Route path="/receivers" element={
              <PageLayout title="Receivers" subtitle="Patients and blood receivers">
                <ReceiversPage />
              </PageLayout>
            } />
            <Route path="/blood-units" element={
              <PageLayout title="Blood Units" subtitle="Blood inventory management">
                <BloodUnitsPage />
              </PageLayout>
            } />
            <Route path="/blood-requests" element={
              <PageLayout title="Blood Requests" subtitle="Manage blood transfusion requests">
                <BloodRequestsPage />
              </PageLayout>
            } />
            <Route path="/donation-events" element={
              <PageLayout title="Donation Events" subtitle="Donation camp and event records">
                <DonationEventsPage />
              </PageLayout>
            } />
            <Route path="/blood-tests" element={
              <PageLayout title="Blood Tests" subtitle="Screening and test results">
                <BloodTestsPage />
              </PageLayout>
            } />
            <Route path="/staff" element={
              <PageLayout title="Staff" subtitle="Blood bank staff and personnel">
                <StaffPage />
              </PageLayout>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
