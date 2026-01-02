/**
 * API client for backend communication.
 */
import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

// Get API URL and ensure it has a protocol
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log for debugging (only in development, only in browser)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('[API] Initial API_BASE_URL:', API_BASE_URL);
}

// Ensure API URL has protocol (for production)
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// Final validation - ensure we have a valid URL
if (!API_BASE_URL || API_BASE_URL === 'undefined') {
  console.error('[API] ERROR: NEXT_PUBLIC_API_URL is not set!');
  API_BASE_URL = 'https://tsfaas-production.up.railway.app'; // Fallback
}

// Remove trailing slash if present
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API] Final API_BASE_URL:', API_BASE_URL);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient();
    // Use getSession() which reads from cookies/localStorage
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    
    if (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Error getting session:', error);
      }
    }
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Added auth token to request:', config.url);
      }
    } else {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API] No session found for request:', config.url);
      }
      // Don't make the request if no session - let the 401 handler deal with it
    }
    
    // CRITICAL FIX for mobile browsers: Remove Content-Type header for FormData
    // Browser MUST set multipart/form-data with boundary automatically
    // This prevents "400 Bad Request" on OPTIONS preflight requests
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
  } catch (error) {
    // Always log errors, but don't expose sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Error in auth interceptor:', error);
    }
  }
  
  return config;
});

// Handle 401 errors - redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Request failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
    }
    
    if (error.response?.status === 401) {
      // Clear any stale session
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Redirect to home/login page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export interface UploadResponse {
  job_id: string;
  columns: string[];
  time_candidates?: Array<{ column: string; score: number }>;
  preview: any[];
  file_url?: string | null;
}

export interface ForecastRequest {
  job_id: string;
  time_column: string;
  target_column: string;
  exogenous?: string[];
  horizon: number;
  model: string;
}

export interface ForecastResponse {
  job_id: string;
  forecast_id: string;
  status: string;
  message?: string;
}

export interface JobInfo {
  job_id: string;
  file_name: string;
  status: string;
  columns: string[];
  created_at: string;
  forecast_id?: string;
  target_column?: string;
  model_used?: string;
}

export interface JobsListResponse {
  jobs: JobInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface BillingProfile {
  is_pro: boolean;
  user_id: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export const api = {
  upload: {
    post: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      
      // CRITICAL FIX for mobile browsers:
      // The interceptor will automatically:
      // 1. Add Authorization header
      // 2. Remove Content-Type header for FormData (browser sets it with boundary)
      // This fixes "400 Bad Request" on OPTIONS preflight requests
      const response = await apiClient.post<UploadResponse>('/api/upload', formData);
      
      return response.data;
    },
    
    get: async (jobId: string): Promise<UploadResponse> => {
      const response = await apiClient.get<UploadResponse>(`/api/upload/${jobId}`);
      return response.data;
    },
  },
  
  forecast: {
    create: async (request: ForecastRequest): Promise<ForecastResponse> => {
      const response = await apiClient.post<ForecastResponse>('/api/forecast', request);
      return response.data;
    },
    
    get: async (forecastId: string): Promise<any> => {
      const response = await apiClient.get(`/api/forecast/${forecastId}`);
      return response.data;
    },
    
    getStatus: async (forecastId: string): Promise<any> => {
      const response = await apiClient.get(`/api/forecast/${forecastId}/status`);
      return response.data;
    },
  },
  
  jobs: {
    list: async (limit: number = 50, offset: number = 0): Promise<JobsListResponse> => {
      const response = await apiClient.get<JobsListResponse>(`/api/jobs?limit=${limit}&offset=${offset}`);
      return response.data;
    },
    
    get: async (jobId: string): Promise<JobInfo> => {
      const response = await apiClient.get<JobInfo>(`/api/jobs/${jobId}`);
      return response.data;
    },
  },
  
  billing: {
    createCheckoutSession: async (): Promise<CheckoutSessionResponse> => {
      const response = await apiClient.post<CheckoutSessionResponse>('/api/billing/create-checkout-session');
      return response.data;
    },
    
    getProfile: async (): Promise<BillingProfile> => {
      const response = await apiClient.get<BillingProfile>('/api/billing/profile');
      return response.data;
    },
  },
};

