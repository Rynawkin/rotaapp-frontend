import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/layouts/MainLayout';
// BUGFIX S5.1: Disable console logs in production
import '@/utils/logger';
// BUGFIX S5.2: Error boundary to prevent white screen crashes
import ErrorBoundary from '@/components/ErrorBoundary';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-gray-600">Yükleniyor...</p>
    </div>
  </div>
);

// Lazy load all pages for better performance
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const RoutesPage = lazy(() => import('@/pages/Routes'));
const CreateRoute = lazy(() => import('@/pages/CreateRoute'));
const EditRoute = lazy(() => import('@/pages/EditRoute'));
const RouteDetail = lazy(() => import('@/pages/RouteDetail'));
const Customers = lazy(() => import('@/pages/Customers'));
const CreateCustomer = lazy(() => import('@/pages/CreateCustomer'));
const EditCustomer = lazy(() => import('@/pages/EditCustomer'));
const CustomerDetail = lazy(() => import('@/pages/CustomerDetail'));
const TestMap = lazy(() => import('@/pages/TestMap'));
const Drivers = lazy(() => import('@/pages/Drivers'));
const CreateDriver = lazy(() => import('@/pages/CreateDriver'));
const EditDriver = lazy(() => import('@/pages/EditDriver'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DriverDetail = lazy(() => import('@/pages/DriverDetail'));
const Vehicles = lazy(() => import('@/pages/Vehicles'));
const CreateVehicle = lazy(() => import('@/pages/CreateVehicle'));
const EditVehicle = lazy(() => import('@/pages/EditVehicle'));
const VehicleDetail = lazy(() => import('@/pages/VehicleDetail'));
const Depots = lazy(() => import('@/pages/Depots'));
const CreateDepot = lazy(() => import('@/pages/CreateDepot'));
const EditDepot = lazy(() => import('@/pages/EditDepot'));
const DepotDetail = lazy(() => import('@/pages/DepotDetail'));
const Journeys = lazy(() => import('@/pages/Journeys'));
const JourneyDetail = lazy(() => import('@/pages/JourneyDetail'));
const LiveTracking = lazy(() => import('@/pages/LiveTracking'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Signup = lazy(() => import('@/pages/Signup'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));
const WorkspaceDetail = lazy(() => import('@/pages/superadmin/WorkspaceDetail'));
const WorkspaceEdit = lazy(() => import('@/pages/superadmin/WorkspaceEdit'));
const PublicFeedback = lazy(() => import('./pages/PublicFeedback'));
const IssuesManagement = lazy(() => import('./pages/superadmin/IssuesManagement'));
const MarketingLeadsManagement = lazy(() => import('./pages/superadmin/MarketingLeadsManagement'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const Support = lazy(() => import('./pages/legal/Support'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const LocationUpdateRequests = lazy(() => import('@/pages/LocationUpdateRequests'));

// Layout wrapper for protected routes - useAuth hook'unu kullanacak şekilde güncellendi
const ProtectedLayout: React.FC<{
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireDispatcher?: boolean;
  requireDriver?: boolean;
}> = ({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireDispatcher = false,
  requireDriver = false
}) => {
    const { logout } = useAuth(); // AuthContext'ten logout fonksiyonunu al

    return (
      <ProtectedRoute
        requireAdmin={requireAdmin}
        requireSuperAdmin={requireSuperAdmin}
        requireDispatcher={requireDispatcher}
        requireDriver={requireDriver}
      >
        <MainLayout onLogout={logout}>{children}</MainLayout>
      </ProtectedRoute>
    );
  };

// App Routes Component - AuthProvider içinde olması gerek
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/feedback/:token" element={<PublicFeedback />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/test-map" element={<TestMap />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/support" element={<Support />} />
      <Route path="/delete-account" element={<DeleteAccount />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      } />

      <Route path="/dashboard" element={
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      } />

      {/* Routes Module */}
      <Route path="/routes" element={
        <ProtectedLayout>
          <RoutesPage />
        </ProtectedLayout>
      } />
      <Route path="/routes/new" element={
        <ProtectedLayout>
          <CreateRoute />
        </ProtectedLayout>
      } />
      <Route path="/routes/:id" element={
        <ProtectedLayout>
          <RouteDetail />
        </ProtectedLayout>
      } />
      <Route path="/routes/:id/edit" element={
        <ProtectedLayout>
          <EditRoute />
        </ProtectedLayout>
      } />

      {/* Customers Module */}
      <Route path="/customers" element={
        <ProtectedLayout>
          <Customers />
        </ProtectedLayout>
      } />
      <Route path="/customers/new" element={
        <ProtectedLayout>
          <CreateCustomer />
        </ProtectedLayout>
      } />
      <Route path="/customers/:id" element={
        <ProtectedLayout>
          <CustomerDetail />
        </ProtectedLayout>
      } />
      <Route path="/customers/:id/edit" element={
        <ProtectedLayout>
          <EditCustomer />
        </ProtectedLayout>
      } />

      {/* Drivers Module */}
      <Route path="/drivers" element={
        <ProtectedLayout>
          <Drivers />
        </ProtectedLayout>
      } />
      <Route path="/drivers/new" element={
        <ProtectedLayout>
          <CreateDriver />
        </ProtectedLayout>
      } />
      <Route path="/drivers/:id" element={
        <ProtectedLayout>
          <DriverDetail />
        </ProtectedLayout>
      } />
      <Route path="/drivers/:id/edit" element={
        <ProtectedLayout>
          <EditDriver />
        </ProtectedLayout>
      } />

      {/* Vehicles Module */}
      <Route path="/vehicles" element={
        <ProtectedLayout>
          <Vehicles />
        </ProtectedLayout>
      } />
      <Route path="/vehicles/new" element={
        <ProtectedLayout>
          <CreateVehicle />
        </ProtectedLayout>
      } />
      <Route path="/vehicles/:id" element={
        <ProtectedLayout>
          <VehicleDetail />
        </ProtectedLayout>
      } />
      <Route path="/vehicles/:id/edit" element={
        <ProtectedLayout>
          <EditVehicle />
        </ProtectedLayout>
      } />

      {/* Depots Module */}
      <Route path="/depots" element={
        <ProtectedLayout>
          <Depots />
        </ProtectedLayout>
      } />
      <Route path="/depots/new" element={
        <ProtectedLayout>
          <CreateDepot />
        </ProtectedLayout>
      } />
      <Route path="/depots/:id" element={
        <ProtectedLayout>
          <DepotDetail />
        </ProtectedLayout>
      } />
      <Route path="/depots/:id/edit" element={
        <ProtectedLayout>
          <EditDepot />
        </ProtectedLayout>
      } />

      {/* Journeys Module */}
      <Route path="/journeys" element={
        <ProtectedLayout>
          <Journeys />
        </ProtectedLayout>
      } />
      <Route path="/journeys/:id" element={
        <ProtectedLayout>
          <JourneyDetail />
        </ProtectedLayout>
      } />

      {/* Live Tracking */}
      <Route path="/tracking" element={
        <ProtectedLayout>
          <LiveTracking />
        </ProtectedLayout>
      } />

      {/* Reports */}
      <Route path="/reports" element={
        <ProtectedLayout>
          <Reports />
        </ProtectedLayout>
      } />

      {/* Settings */}
      <Route path="/settings" element={
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      } />

      {/* Location Update Requests - Dispatcher ve Admin için */}
      <Route path="/location-requests" element={
        <ProtectedLayout requireDispatcher={true}>
          <LocationUpdateRequests />
        </ProtectedLayout>
      } />

      {/* Super Admin Routes - Require SuperAdmin Role */}
      <Route path="/super-admin" element={
        <ProtectedLayout requireSuperAdmin={true}>
          <SuperAdminDashboard />
        </ProtectedLayout>
      } />
      <Route path="/super-admin/workspace/:id" element={
        <ProtectedLayout requireSuperAdmin={true}>
          <WorkspaceDetail />
        </ProtectedLayout>
      } />
      <Route path="/superadmin/issues" element={
        <ProtectedRoute requiredRole="SuperAdmin">
          <IssuesManagement />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/marketing-leads" element={
        <ProtectedRoute requiredRole="SuperAdmin">
          <MarketingLeadsManagement />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/workspace/:id/edit" element={
        <ProtectedLayout requireSuperAdmin={true}>
          <WorkspaceEdit />
        </ProtectedLayout>
      } />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;