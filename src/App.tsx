import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import DriverDetail from '@/pages/DriverDetail';
import Vehicles from '@/pages/Vehicles';
import CreateVehicle from '@/pages/CreateVehicle';
import EditVehicle from '@/pages/EditVehicle';
import VehicleDetail from '@/pages/VehicleDetail';
import Journeys from '@/pages/Journeys';
import LiveTracking from '@/pages/LiveTracking';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  useEffect(() => {
    // Initialize mock authentication
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === null) {
      localStorage.setItem('isAuthenticated', 'false');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/test-map" element={<TestMap />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Routes Module */}
        <Route path="/routes" element={
          <ProtectedRoute>
            <RoutesPage />
          </ProtectedRoute>
        } />
        <Route path="/routes/new" element={
          <ProtectedRoute>
            <CreateRoute />
          </ProtectedRoute>
        } />
        <Route path="/routes/:id" element={
          <ProtectedRoute>
            <RouteDetail />
          </ProtectedRoute>
        } />
        <Route path="/routes/:id/edit" element={
          <ProtectedRoute>
            <EditRoute />
          </ProtectedRoute>
        } />
        
        {/* Customers Module */}
        <Route path="/customers" element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        } />
        <Route path="/customers/new" element={
          <ProtectedRoute>
            <CreateCustomer />
          </ProtectedRoute>
        } />
        <Route path="/customers/:id" element={
          <ProtectedRoute>
            <CustomerDetail />
          </ProtectedRoute>
        } />
        <Route path="/customers/:id/edit" element={
          <ProtectedRoute>
            <EditCustomer />
          </ProtectedRoute>
        } />
        
        {/* Drivers Module - TAMAMLANDI */}
        <Route path="/drivers" element={
          <ProtectedRoute>
            <Drivers />
          </ProtectedRoute>
        } />
        <Route path="/drivers/new" element={
          <ProtectedRoute>
            <CreateDriver />
          </ProtectedRoute>
        } />
        <Route path="/drivers/:id" element={
          <ProtectedRoute>
            <DriverDetail />
          </ProtectedRoute>
        } />
        <Route path="/drivers/:id/edit" element={
          <ProtectedRoute>
            <EditDriver />
          </ProtectedRoute>
        } />
        
        {/* Vehicles Module - TAMAMLANDI */}
        <Route path="/vehicles" element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        } />
        <Route path="/vehicles/new" element={
          <ProtectedRoute>
            <CreateVehicle />
          </ProtectedRoute>
        } />
        <Route path="/vehicles/:id" element={
          <ProtectedRoute>
            <VehicleDetail />
          </ProtectedRoute>
        } />
        <Route path="/vehicles/:id/edit" element={
          <ProtectedRoute>
            <EditVehicle />
          </ProtectedRoute>
        } />
        
        {/* Journeys Module */}
        <Route path="/journeys" element={
          <ProtectedRoute>
            <Journeys />
          </ProtectedRoute>
        } />
        
        {/* Live Tracking */}
        <Route path="/tracking" element={
          <ProtectedRoute>
            <LiveTracking />
          </ProtectedRoute>
        } />
        
        {/* Reports */}
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        
        {/* Settings */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;