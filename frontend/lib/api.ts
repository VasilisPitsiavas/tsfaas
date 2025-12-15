/**
 * API client for backend communication.
 */
import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

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
};

