import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import Landing from './pages/Landing.tsx';
import Auth from './pages/Auth.tsx';
import SsoCallback from './pages/SsoCallback.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ActionLog from './pages/ActionLog.tsx';
import Assistant from './pages/Assistant.tsx';
import Reports from './pages/Reports.tsx';
import Alerts from './pages/Alerts.tsx';
import CompareCrops from './pages/CompareCrops.tsx';
import Profile from './pages/Profile.tsx';
import { LoadingSpinner } from './components/LoadingSpinner';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if Clerk key is configured
const isClerkConfigured = clerkPubKey && clerkPubKey !== 'your_clerk_publishable_key_here';

// Protected Route wrapper with loading state
const ProtectedRoute = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// Public Route wrapper (redirects to dashboard if signed in)
const PublicRoute = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
});

PublicRoute.displayName = 'PublicRoute';

const AppRoutes = React.memo(() => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />
        <Route path="/auth/sso-callback" element={<SsoCallback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/actions/log" element={
          <ProtectedRoute>
            <ActionLog />
          </ProtectedRoute>
        } />
        <Route path="/assistant" element={
          <ProtectedRoute>
            <Assistant />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } />
        <Route path="/compare-crops" element={
          <ProtectedRoute>
            <CompareCrops />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
});

AppRoutes.displayName = 'AppRoutes';

function App() {
  // Show error message if Clerk is not configured
  if (!isClerkConfigured) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>⚠️ Clerk Authentication Not Configured</h1>
        <p>Please add your Clerk Publishable Key to <code>frontend/.env</code></p>
        <ol style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
          <li>Get your key from: <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank">Clerk Dashboard</a></li>
          <li>Update <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>frontend/.env</code></li>
          <li>Restart the dev server</li>
        </ol>
        <p style={{ marginTop: '2rem', color: '#666' }}>
          Current value: <code>{clerkPubKey || 'Not set'}</code>
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppRoutes />
    </ClerkProvider>
  );
}

export default App;
