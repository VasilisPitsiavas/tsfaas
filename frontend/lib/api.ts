/**
 * API client for backend communication.
 */
import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

// Get API URL and ensure it has a protocol
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Ensure API URL has protocol (for production)
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
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
      console.error('[API] Error getting session:', error);
    }
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      console.log('[API] Added auth token to request:', config.url);
    } else {
      console.warn('[API] No session found for request:', config.url);
      // Don't make the request if no session - let the 401 handler deal with it
    }
  } catch (error) {
    console.error('[API] Error in auth interceptor:', error);
  }
  
  return config;
});

// Handle 401 errors - redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information
    console.error('[API] Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
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
      
      const response = await apiClient.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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

