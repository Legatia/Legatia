import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingSpinner } from './components/layout/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

// Pages
import { LoginPage } from './pages/LoginPage';
import { CreateProfilePage } from './pages/CreateProfilePage';
import { ProfilePage } from './pages/ProfilePage';
import { FamiliesPage } from './pages/FamiliesPage';
import { CreateFamilyPage } from './pages/CreateFamilyPage';

// Placeholder pages for features not yet implemented
const NotificationsPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Notifications</h2><p className="text-muted-foreground">Coming soon...</p></div>;
const InvitationsPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Invitations</h2><p className="text-muted-foreground">Coming soon...</p></div>;
const SearchPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Search Users</h2><p className="text-muted-foreground">Coming soon...</p></div>;
const FamilyDetailPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Family Details</h2><p className="text-muted-foreground">Coming soon...</p></div>;
const SettingsPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground">Coming soon...</p></div>;

function App() {
  const { init, loading } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing Legatia..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes with layout */}
        <Route path="/" element={<Layout />}>
          {/* Redirect root to families */}
          <Route index element={<Navigate to="/families" replace />} />
          
          {/* Profile creation (authenticated but no profile required) */}
          <Route 
            path="/create-profile" 
            element={
              <ProtectedRoute>
                <CreateProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes that require both authentication and profile */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requiresProfile>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/families" 
            element={
              <ProtectedRoute requiresProfile>
                <FamiliesPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-family" 
            element={
              <ProtectedRoute requiresProfile>
                <CreateFamilyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/family/:id" 
            element={
              <ProtectedRoute requiresProfile>
                <FamilyDetailPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute requiresProfile>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/invitations" 
            element={
              <ProtectedRoute requiresProfile>
                <InvitationsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/search" 
            element={
              <ProtectedRoute requiresProfile>
                <SearchPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute requiresProfile>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Catch all - redirect to families */}
        <Route path="*" element={<Navigate to="/families" replace />} />
      </Routes>
    </Router>
  );
}

export default App;