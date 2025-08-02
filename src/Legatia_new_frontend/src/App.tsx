import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingSpinner } from './components/layout/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

// Critical pages (not lazy loaded)
import { LoginPage } from './pages/LoginPage';
import { CreateProfilePage } from './pages/CreateProfilePage';
import { FamiliesPage } from './pages/FamiliesPage';

// Lazy loaded pages
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CreateFamilyPage = lazy(() => import('./pages/CreateFamilyPage').then(m => ({ default: m.CreateFamilyPage })));
const FamilyDetailPage = lazy(() => import('./pages/FamilyDetailPage').then(m => ({ default: m.FamilyDetailPage })));
const AddFamilyMemberPage = lazy(() => import('./pages/AddFamilyMemberPage').then(m => ({ default: m.AddFamilyMemberPage })));
const AddEventPage = lazy(() => import('./pages/AddEventPage'));
const ViewEventsPage = lazy(() => import('./pages/ViewEventsPage').then(m => ({ default: m.ViewEventsPage })));
const EditFamilyMemberPage = lazy(() => import('./pages/EditFamilyMemberPage').then(m => ({ default: m.EditFamilyMemberPage })));
const EditEventPage = lazy(() => import('./pages/EditEventPage').then(m => ({ default: m.EditEventPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
const UserSearchPage = lazy(() => import('./pages/UserSearchPage').then(m => ({ default: m.UserSearchPage })));
const SendInvitationPage = lazy(() => import('./pages/SendInvitationPage').then(m => ({ default: m.SendInvitationPage })));
const GhostClaimsPage = lazy(() => import('./pages/GhostClaimsPage').then(m => ({ default: m.GhostClaimsPage })));
const AdminClaimsPage = lazy(() => import('./pages/AdminClaimsPage').then(m => ({ default: m.AdminClaimsPage })));

// Placeholder pages for features not yet implemented
const SettingsPage = () => <div className="text-center py-12"><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground">Coming soon...</p></div>;

// Helper component for lazy loaded routes
const LazyRoute: React.FC<{ children: React.ReactNode; requiresProfile?: boolean }> = ({ 
  children, 
  requiresProfile = true 
}) => (
  <ProtectedRoute requiresProfile={requiresProfile}>
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
      {children}
    </Suspense>
  </ProtectedRoute>
);

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
              <LazyRoute>
                <ProfilePage />
              </LazyRoute>
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
              <LazyRoute>
                <CreateFamilyPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/family/:id" 
            element={
              <LazyRoute>
                <FamilyDetailPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/family/:id/add-member" 
            element={
              <LazyRoute>
                <AddFamilyMemberPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/family/:id/member/:memberId/add-event" 
            element={
              <ProtectedRoute requiresProfile>
                <AddEventPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/family/:id/member/:memberId/events" 
            element={
              <ProtectedRoute requiresProfile>
                <ViewEventsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/family/:id/member/:memberId/edit" 
            element={
              <ProtectedRoute requiresProfile>
                <EditFamilyMemberPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/family/:id/member/:memberId/event/:eventId/edit" 
            element={
              <ProtectedRoute requiresProfile>
                <EditEventPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notifications" 
            element={
              <LazyRoute>
                <NotificationsPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/invitations" 
            element={
              <LazyRoute>
                <InvitationsPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/search" 
            element={
              <LazyRoute>
                <UserSearchPage />
              </LazyRoute>
            } 
          />
          
          <Route 
            path="/family/:familyId/invite" 
            element={
              <ProtectedRoute requiresProfile>
                <SendInvitationPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ghost-claims" 
            element={
              <ProtectedRoute requiresProfile>
                <GhostClaimsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin-claims" 
            element={
              <ProtectedRoute requiresProfile>
                <AdminClaimsPage />
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