import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  workspaceId: number;
  workspaceName?: string;
  isAdmin: boolean;
  isDispatcher: boolean;
  isDriver: boolean;
  isSuperAdmin: boolean;
  isOnboarded: boolean;
  depotId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  // Role helper methods
  getUserRole: () => string;
  canAccessAdminFeatures: () => boolean;
  canAccessDispatcherFeatures: () => boolean;
  canAccessDriverFeatures: () => boolean;
  canAccessSuperAdminFeatures: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Token'ı localStorage'dan al ve kullanıcı bilgilerini yükle
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedWorkspaceId = localStorage.getItem('workspaceId');

        if (storedToken && storedUser) {
          setToken(storedToken);
          
          // User'ı parse et
          const parsedUser = JSON.parse(storedUser);
          
          // WorkspaceId'yi kontrol et ve güncelle
          if (storedWorkspaceId) {
            parsedUser.workspaceId = parseInt(storedWorkspaceId);
          }
          
          setUser(parsedUser);

          // API header'ını ayarla
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Token'ın geçerliliğini kontrol et
          try {
            await authService.me(); // Backend'e token validation isteği gönder
            console.log('Token is still valid');
          } catch (tokenError: any) {
            console.error('Token validation failed on app init:', tokenError);
            if (tokenError.response?.status === 401) {
              console.log('Token expired, clearing auth data...');
              // Token geçersizse tüm auth verisini temizle
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('workspaceId');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('isAuthenticated');
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Kimlik doğrulama başlatılırken hata oluştu';
        console.error('User-friendly error:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Token değiştiğinde API header'ını güncelle
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      
      if (response && response.bearerToken && response.me) {
        // Token'ı kaydet
        const newToken = response.bearerToken;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        
        // User bilgilerini kaydet
        const userData: User = {
          id: response.me.id,
          email: response.me.email,
          fullName: response.me.fullName || response.me.email,
          phoneNumber: response.me.phoneNumber,
          workspaceId: response.me.workspaceId,
          workspaceName: response.me.workspace?.name,
          isAdmin: response.me.isAdmin || false,
          isDispatcher: response.me.isDispatcher || false,
          isDriver: response.me.isDriver || false,
          isSuperAdmin: response.me.isSuperAdmin || false,
          isOnboarded: response.me.isOnboarded || false,
          depotId: response.me.depotId
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // WorkspaceId'yi ayrıca kaydet
        if (userData.workspaceId) {
          localStorage.setItem('workspaceId', userData.workspaceId.toString());
        }
        
        // API header'ını ayarla
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        console.log('Login successful in AuthContext');
        
        // Redirect based on role
        if (userData.isSuperAdmin) {
          navigate('/super-admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Hata mesajını düzgün göster
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || error.message || 'Giriş başarısız';
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // State'leri temizle
    setUser(null);
    setToken(null);
    
    // localStorage'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspaceId');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    
    // API header'ını temizle
    delete api.defaults.headers.common['Authorization'];
    
    // Login sayfasına yönlendir
    navigate('/login');
    
    console.log('Logged out successfully');
  };

  const logout = () => {
    handleLogout();
  };

  const refreshUser = async () => {
    try {
      // Token varsa kullanıcı bilgilerini tekrar yükle ve token'ın geçerliliğini kontrol et
      if (token) {
        console.log('Refreshing user data and validating token...');
        const response = await authService.me(); // Backend'den güncel kullanıcı bilgilerini al
        
        if (response) {
          const userData: User = {
            id: response.id,
            email: response.email,
            fullName: response.fullName || response.email,
            phoneNumber: response.phoneNumber,
            workspaceId: response.workspaceId,
            workspaceName: response.workspace?.name,
            isAdmin: response.isAdmin || false,
            isDispatcher: response.isDispatcher || false,
            isDriver: response.isDriver || false,
            isSuperAdmin: response.isSuperAdmin || false,
            isOnboarded: response.isOnboarded || false,
            depotId: response.depotId
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          if (userData.workspaceId) {
            localStorage.setItem('workspaceId', userData.workspaceId.toString());
          }
          
          console.log('User data refreshed successfully');
        }
      }
    } catch (error: any) {
      console.error('Token validation failed:', error);
      
      // Token geçersizse logout yap
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, logging out...');
        handleLogout();
      }
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    if (userData.workspaceId) {
      localStorage.setItem('workspaceId', userData.workspaceId.toString());
    }
  };

  // Role helper methods
  const getUserRole = (): string => {
    if (!user) return 'guest';
    
    if (user.isSuperAdmin) return 'superadmin';
    if (user.isAdmin) return 'admin';
    if (user.isDispatcher) return 'dispatcher';
    if (user.isDriver) return 'driver';
    return 'user';
  };

  const canAccessSuperAdminFeatures = (): boolean => {
    return user?.isSuperAdmin === true;
  };

  const canAccessAdminFeatures = (): boolean => {
    return user?.isAdmin === true || user?.isSuperAdmin === true;
  };

  const canAccessDispatcherFeatures = (): boolean => {
    return user?.isDispatcher === true || user?.isAdmin === true || user?.isSuperAdmin === true;
  };

  const canAccessDriverFeatures = (): boolean => {
    return user?.isDriver === true || user?.isDispatcher === true || user?.isAdmin === true || user?.isSuperAdmin === true;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
    getUserRole,
    canAccessAdminFeatures,
    canAccessDispatcherFeatures,
    canAccessDriverFeatures,
    canAccessSuperAdminFeatures
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireDispatcher?: boolean;
  requireDriver?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireDispatcher = false,
  requireDriver = false
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
    
    // Role-based access control
    if (!isLoading && user) {
      if (requireSuperAdmin && !user.isSuperAdmin) {
        navigate('/dashboard');
      } else if (requireAdmin && !user.isAdmin && !user.isSuperAdmin) {
        navigate('/dashboard');
      } else if (requireDispatcher && !user.isDispatcher && !user.isAdmin && !user.isSuperAdmin) {
        navigate('/dashboard');
      } else if (requireDriver && !user.isDriver && !user.isDispatcher && !user.isAdmin && !user.isSuperAdmin) {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, requireSuperAdmin, requireDispatcher, requireDriver, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (requireSuperAdmin && !user?.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim için Super Admin yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !user?.isAdmin && !user?.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim için Admin yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthContext;