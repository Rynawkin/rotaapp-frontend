import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Production'da relative path (/api), development'ta absolute URL
const API_URL = import.meta.env.MODE === 'production'
  ? '/api'  // Vercel rewrite kullan
  : (import.meta.env.VITE_API_URL || 'http://localhost:5055/api');

console.log('API URL:', API_URL);

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 10,
  REQUEST_INTERVAL_MS: 100, // Minimum 100ms between requests
  CACHE_DURATION_MS: 5000, // 5 seconds cache for deduplication
};

// Request queue and rate limiting state
class RequestManager {
  private activeRequests = new Set<Promise<any>>();
  private requestQueue: Array<() => Promise<any>> = [];
  private lastRequestTimes = new Map<string, number>();
  private responseCache = new Map<string, { response: any; timestamp: number }>();
  private isProcessing = false;

  // Generate cache key from request config
  private getCacheKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }

  // Check if request is cached and not expired
  private getCachedResponse(cacheKey: string) {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < RATE_LIMIT_CONFIG.CACHE_DURATION_MS) {
      console.log('🚀 Returning cached response for:', cacheKey);
      return cached.response;
    }
    return null;
  }

  // Cache response
  private cacheResponse(cacheKey: string, response: any) {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    setTimeout(() => {
      this.responseCache.delete(cacheKey);
    }, RATE_LIMIT_CONFIG.CACHE_DURATION_MS);
  }

  // Check if we should throttle this endpoint
  private shouldThrottle(config: AxiosRequestConfig): number {
    const endpointKey = `${config.method}:${config.url}`;
    const lastRequestTime = this.lastRequestTimes.get(endpointKey);
    
    if (!lastRequestTime) return 0;
    
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    const remainingThrottleTime = RATE_LIMIT_CONFIG.REQUEST_INTERVAL_MS - timeSinceLastRequest;
    
    return Math.max(0, remainingThrottleTime);
  }

  // Update last request time for throttling
  private updateLastRequestTime(config: AxiosRequestConfig) {
    const endpointKey = `${config.method}:${config.url}`;
    this.lastRequestTimes.set(endpointKey, Date.now());
  }

  // Process request queue
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests.size < RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS) {
      const requestExecutor = this.requestQueue.shift();
      if (requestExecutor) {
        const requestPromise = requestExecutor();
        this.activeRequests.add(requestPromise);
        
        requestPromise.finally(() => {
          this.activeRequests.delete(requestPromise);
          this.processQueue(); // Continue processing queue
        });
      }
    }

    this.isProcessing = false;
  }

  // Execute request with rate limiting
  async executeRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const cacheKey = this.getCacheKey(config);
    
    // Check for cached response first
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Promise((resolve, reject) => {
      const requestExecutor = async () => {
        try {
          // Check throttling
          const throttleDelay = this.shouldThrottle(config);
          if (throttleDelay > 0) {
            console.log(`⏳ Throttling request to ${config.url} for ${throttleDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, throttleDelay));
          }

          // Update request time for throttling
          this.updateLastRequestTime(config);

          console.log(`🚀 Executing request: ${config.method} ${config.url} (Active: ${this.activeRequests.size}/${RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS})`);
          
          // Execute the actual request
          const response = await axios(config);
          
          // Cache the response
          this.cacheResponse(cacheKey, response);
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

      // Add to queue or execute immediately
      if (this.activeRequests.size >= RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS) {
        console.log(`📋 Queueing request: ${config.method} ${config.url} (Queue size: ${this.requestQueue.length + 1})`);
        this.requestQueue.push(requestExecutor);
      } else {
        const requestPromise = requestExecutor();
        this.activeRequests.add(requestPromise);
        
        requestPromise.finally(() => {
          this.activeRequests.delete(requestPromise);
          this.processQueue();
        });
      }
    });
  }

  // Get current stats for debugging
  getStats() {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      cachedResponses: this.responseCache.size,
    };
  }
}

const requestManager = new RequestManager();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Rate limiting disabled - using default axios adapter
// api.defaults.adapter = async (config) => {
//   return requestManager.executeRequest(config);
// };

// Sayfa yüklendiğinde token varsa header'a ekle
const initialToken = localStorage.getItem('token');
if (initialToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  console.log('Initial token loaded from localStorage');
}

// Request interceptor - token'ı her istekte gönder
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'exists' : 'missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization?.substring(0, 20) + '...');
    }
    
    // WorkspaceId'yi de kontrol et (debug için)
    const workspaceId = localStorage.getItem('workspaceId');
    if (workspaceId) {
      console.log('WorkspaceId in localStorage:', workspaceId);
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    console.log('Request headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    // Backend'den gelen mesajı kullanıcı dostu hale getir
    let userFriendlyMessage = '';
    
    if (error.response?.data?.message) {
      // Backend'den mesaj geliyorsa kullan
      userFriendlyMessage = error.response.data.message;
    } else {
      // Status code'a göre fallback mesajlar
      switch (error.response?.status) {
        case 400:
          userFriendlyMessage = 'Geçersiz istek. Lütfen bilgileri kontrol edin.';
          break;
        case 401:
          userFriendlyMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
          break;
        case 403:
          userFriendlyMessage = 'Bu işlem için yetkiniz yok.';
          break;
        case 404:
          userFriendlyMessage = 'Aradığınız kayıt bulunamadı.';
          break;
        case 408:
          userFriendlyMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
          break;
        case 500:
          userFriendlyMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
          break;
        default:
          userFriendlyMessage = error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      }
    }
    
    // Error nesnesine kullanıcı dostu mesajı ekle
    error.userFriendlyMessage = userFriendlyMessage;
    
    // Backend'den gelen "Workspace is not found" hatası kontrolü
    if (error.response?.status === 404 && 
        error.response?.data?.message === 'Workspace is not found.') {
      console.error('Workspace not found - possible token/workspace mismatch');
      
      // Login sayfasında değilsek ve bu hata login isteğinden gelmiyorsa
      if (!window.location.pathname.includes('/login') && 
          !error.config?.url?.includes('/me/login')) {
        
        const token = localStorage.getItem('token');
        const workspaceId = localStorage.getItem('workspaceId');
        const user = localStorage.getItem('user');
        
        console.log('Debug - Token exists:', !!token);
        console.log('Debug - WorkspaceId:', workspaceId);
        console.log('Debug - User:', user);
        
        // Token varsa ama workspace bulunamıyorsa, token eski olabilir
        console.error('Token exists but workspace not found - clearing auth and redirecting to login');
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    
    // Backend'den gelen HTML response'u kontrol et (Login redirect)
    if (error.response?.status === 404 && 
        typeof error.response?.data === 'string' && 
        error.response.data.includes('Login')) {
      console.error('Backend is redirecting to login page - authentication issue');
      
      // Token'ı kontrol et
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    // 401 Unauthorized - token geçersiz veya süresi dolmuş
    if (error.response?.status === 401) {
      // BUGFIX S5.5: Try to refresh token before logging out
      const refreshToken = localStorage.getItem('refreshToken');
      const originalRequest = error.config;

      // Prevent infinite refresh loop
      if (!originalRequest._retry && refreshToken && !originalRequest.url?.includes('/refresh-token')) {
        originalRequest._retry = true;
        console.log('Token expired, attempting to refresh...');

        try {
          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('./auth.service');
          const refreshSuccess = await authService.refreshToken();

          if (refreshSuccess) {
            // Retry the original request with new token
            console.log('Token refreshed, retrying original request...');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If refresh failed or not available, logout
      console.log('Unauthorized - clearing auth data');
      localStorage.clear();
      delete api.defaults.headers.common['Authorization'];

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Debug helper functions
export const debugApiAuth = () => {
  console.log('=== API Auth Debug ===');
  console.log('Token:', localStorage.getItem('token')?.substring(0, 50) + '...');
  console.log('WorkspaceId:', localStorage.getItem('workspaceId'));
  console.log('User:', localStorage.getItem('user'));
  console.log('API Headers:', api.defaults.headers.common);
  console.log('====================');
};

export const debugRateLimit = () => {
  const stats = requestManager.getStats();
  console.log('=== Rate Limit Debug ===');
  console.log('Active Requests:', stats.activeRequests);
  console.log('Queued Requests:', stats.queuedRequests);
  console.log('Cached Responses:', stats.cachedResponses);
  console.log('Max Concurrent:', RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS);
  console.log('Request Interval:', RATE_LIMIT_CONFIG.REQUEST_INTERVAL_MS + 'ms');
  console.log('Cache Duration:', RATE_LIMIT_CONFIG.CACHE_DURATION_MS + 'ms');
  console.log('========================');
};

// Expose rate limiting configuration for runtime adjustment if needed
export const updateRateLimitConfig = (newConfig: Partial<typeof RATE_LIMIT_CONFIG>) => {
  Object.assign(RATE_LIMIT_CONFIG, newConfig);
  console.log('Rate limit config updated:', RATE_LIMIT_CONFIG);
};