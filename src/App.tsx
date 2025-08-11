import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import RoutesPage from '@/pages/Routes';
import CreateRoute from '@/pages/CreateRoute';
import EditRoute from '@/pages/EditRoute';
import RouteDetail from '@/pages/RouteDetail';
import Customers from '@/pages/Customers';
import CreateCustomer from '@/pages/CreateCustomer';
import EditCustomer from '@/pages/EditCustomer';
import CustomerDetail from '@/pages/CustomerDetail';
import Login from '@/pages/Login';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* Routes Module */}
                  <Route path="/routes" element={<RoutesPage />} />
                  <Route path="/routes/new" element={<CreateRoute />} />
                  <Route path="/routes/:id" element={<RouteDetail />} />
                  <Route path="/routes/:id/edit" element={<EditRoute />} />
                  
                  {/* Customers Module */}
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/new" element={<CreateCustomer />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/customers/:id/edit" element={<EditCustomer />} />
                  
                  {/* Other Pages - Coming Soon */}
                  <Route path="/journeys" element={<div className="p-6">Seferler Sayfası - Yakında</div>} />
                  <Route path="/drivers" element={<div className="p-6">Sürücüler Sayfası - Yakında</div>} />
                  <Route path="/depots" element={<div className="p-6">Depolar Sayfası - Yakında</div>} />
                  <Route path="/tracking" element={<div className="p-6">Canlı Takip Sayfası - Yakında</div>} />
                  <Route path="/reports" element={<div className="p-6">Raporlar Sayfası - Yakında</div>} />
                  <Route path="/profile" element={<div className="p-6">Profil Sayfası - Yakında</div>} />
                  <Route path="/activities" element={<div className="p-6">Aktiviteler Sayfası - Yakında</div>} />
                  
                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;