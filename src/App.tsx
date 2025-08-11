import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';

// Diğer sayfalar (şimdilik placeholder)
const RoutesPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Rotalar</h2>
    <p className="text-gray-600">Rota yönetimi sayfası yakında eklenecek...</p>
  </div>
);

const CustomersPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Müşteriler</h2>
    <p className="text-gray-600">Müşteri yönetimi sayfası yakında eklenecek...</p>
  </div>
);

const JourneysPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Seferler</h2>
    <p className="text-gray-600">Sefer yönetimi sayfası yakında eklenecek...</p>
  </div>
);

const DriversPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sürücüler</h2>
    <p className="text-gray-600">Sürücü yönetimi sayfası yakında eklenecek...</p>
  </div>
);

const DepotsPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Depolar</h2>
    <p className="text-gray-600">Depo yönetimi sayfası yakında eklenecek...</p>
  </div>
);

const TrackingPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Canlı Takip</h2>
    <p className="text-gray-600">Canlı takip haritası yakında eklenecek...</p>
  </div>
);

const ReportsPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Raporlar</h2>
    <p className="text-gray-600">Raporlama sayfası yakında eklenecek...</p>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle login
  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  // Handle logout (MainLayout'tan çağrılacak)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />

        {/* Protected Routes with Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MainLayout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/routes" element={<RoutesPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/journeys" element={<JourneysPage />} />
                  <Route path="/drivers" element={<DriversPage />} />
                  <Route path="/depots" element={<DepotsPage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  
                  {/* 404 Page */}
                  <Route 
                    path="*" 
                    element={
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">404 - Sayfa Bulunamadı</h2>
                        <p className="text-gray-600 mb-6">Aradığınız sayfa mevcut değil.</p>
                        <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                          Ana Sayfaya Dön →
                        </a>
                      </div>
                    } 
                  />
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