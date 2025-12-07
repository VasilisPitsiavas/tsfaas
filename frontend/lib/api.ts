/**
 * API client for backend communication.
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadResponse {
  job_id: string;
  columns: string[];
  detected_time_column: string;
  preview: any[];
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
};

