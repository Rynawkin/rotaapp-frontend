import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import RoutesPage from '@/pages/Routes';
import CreateRoute from '@/pages/CreateRoute';
import EditRoute from '@/pages/EditRoute';
import RouteDetail from '@/pages/RouteDetail';
import Customers from '@/pages/Customers';
import CreateCustomer from '@/pages/CreateCustomer';
import EditCustomer from '@/pages/EditCustomer';
import CustomerDetail from '@/pages/CustomerDetail';
import TestMap from '@/pages/TestMap';
import Drivers from '@/pages/Drivers';
import CreateDriver from '@/pages/CreateDriver';
import EditDriver from '@/pages/EditDriver';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverDetail from '@/pages/DriverDetail';
import Vehicles from '@/pages/Vehicles';
import CreateVehicle from '@/pages/CreateVehicle';
import EditVehicle from '@/pages/EditVehicle';
import VehicleDetail from '@/pages/VehicleDetail';
import Depots from '@/pages/Depots';
import CreateDepot from '@/pages/CreateDepot';
import EditDepot from '@/pages/EditDepot';
import DepotDetail from '@/pages/DepotDetail';
import Journeys from '@/pages/Journeys';
import JourneyDetail from '@/pages/JourneyDetail';
import LiveTracking from '@/pages/LiveTracking';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import WorkspaceDetail from '@/pages/superadmin/WorkspaceDetail';
import WorkspaceEdit from '@/pages/superadmin/WorkspaceEdit';
import PublicFeedback from './pages/PublicFeedback';
import IssuesManagement from './pages/superadmin/IssuesManagement';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import DeleteAccount from './pages/DeleteAccount';
import LocationUpdateRequests from './pages/LocationUpdateRequests';

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
      <Route path="/super-admin/workspace/:id/edit" element={
        <ProtectedLayout requireSuperAdmin={true}>
          <WorkspaceEdit />
        </ProtectedLayout>
      } />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;