import axios, { AxiosError } from "axios";

// Keep all backend URLs centralized so they can be configured via environment variables.
// Vite exposes env vars starting with VITE_ via import.meta.env.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://187.127.131.38:8000";
export const BACKEND_API_URL = `${BACKEND_URL}/api`;
export const BACKEND_UPLOAD_URL = `${BACKEND_URL}/uploads`;

// Simple response cache for GET requests
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const api = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 30000, // Increased from 10s to 30s for slower queries
});

// Request interceptor: Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // NOTE: We used to try to return a cached response object here to avoid network calls.
  // However, Axios expects request interceptors to return the request config, and returning
  // a response object can cause internal errors like "Cannot read properties of undefined (reading 'toUpperCase')".
  // Cache is still applied in the response interceptor below.

  return config;
});

// Response interceptor: Handle 401 errors and cache successful GET responses
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config?.method?.toLowerCase() === "get") {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      
      // Redirect to login page
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

// Function to clear cache (useful when data changes)
export const clearCache = () => {
  responseCache.clear();
};

// Function to clear specific cache entry
export const clearCacheEntry = (url: string, params?: any) => {
  const cacheKey = `${url}?${new URLSearchParams(params || {}).toString()}`;
  responseCache.delete(cacheKey);
};

export default api;