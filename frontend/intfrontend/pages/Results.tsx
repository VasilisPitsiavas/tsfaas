'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/lib/navigation';
import { api } from '@/lib/api';
import { Button } from '@/intfrontend/components/ui/button';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Loader2, Home, Upload } from 'lucide-react';
import ForecastChart from '@/intfrontend/components/forecast/ForecastChart';
import MetricsCard from '@/intfrontend/components/forecast/MetricsCard';
import InsightsPanel from '@/intfrontend/components/forecast/InsightsPanel';
import ExportButtons from '@/intfrontend/components/forecast/ExportButtons';
import ModelComparisonTabs from '@/intfrontend/components/forecast/ModelComparisonTabs';
import { toast } from 'sonner';

interface ModelResult {
  predictions: number[];
  lower_bound?: number[] | null;
  upper_bound?: number[] | null;
  metrics: {
    mae?: number;
    rmse?: number;
    mape?: number;
    accuracy?: number;
  };
}

interface ForecastResult {
  chart_data?: Array<{
    date: string;
    actual?: number | null;
    forecast?: number | null;
    lower_bound?: number | null;
    upper_bound?: number | null;
    is_forecast?: boolean;
  }>;
  metrics?: {
    mae?: number;
    rmse?: number;
    mape?: number;
    accuracy?: number;
  };
  model_used?: string;
  status?: string;
  all_models?: Record<string, ModelResult>;
  historical_data?: Array<{ date: string; actual: number | null; is_forecast: boolean }>;
  insights?: string;
  forecast_dates?: string[];
  predictions?: number[];
  lower_bound?: number[] | null;
  upper_bound?: number[] | null;
  chart_path?: string;
}

export default function Results() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forecastId, setForecastId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [insights, setInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState<ModelResult | null>(null);
  const [currentChartData, setCurrentChartData] = useState<Array<{
    date: string;
    actual?: number | null;
    forecast?: number | null;
    lower_bound?: number | null;
    upper_bound?: number | null;
    is_forecast?: boolean;
  }>>([]);
  
  // Refs to track intervals/timeouts for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    const forecastIdParam = searchParams.get('forecast_id');
    const jobIdParam = searchParams.get('job_id');
    
    if (forecastIdParam) {
      setForecastId(forecastIdParam);
      setJobId(jobIdParam);
      loadForecastResults(forecastIdParam);
    } else {
      toast.error('No forecast ID provided');
      router.push(createPageUrl('Upload'));
    }
    
    // Cleanup function: clear intervals and timeouts on unmount or when effect re-runs
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [searchParams, router]);

  const loadForecastResults = async (id: string) => {
    // Clean up any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsLoading(true);
    isPollingRef.current = true;
    
    try {
      // Poll for results
      pollIntervalRef.current = setInterval(async () => {
        // Check if we're still supposed to be polling
        if (!isPollingRef.current) {
          return;
        }
        
        try {
          const statusResponse = await api.forecast.getStatus(id);
          
          if (statusResponse.status === 'completed' || statusResponse.status === 'finished') {
            // Stop polling
            isPollingRef.current = false;
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            const result = await api.forecast.get(id);
            
            // Build chart data: historical + forecast
            const chartData: Array<{
              date: string;
              actual?: number | null;
              forecast?: number | null;
              lower_bound?: number | null;
              upper_bound?: number | null;
              is_forecast?: boolean;
            }> = [];
            
            // Add historical data if available
            if (result.historical_data && result.historical_data.length > 0) {
              result.historical_data.forEach((point: any) => {
                chartData.push({
                  date: point.date,
                  actual: point.actual,
                  is_forecast: false
                });
              });
            }
            
            // Add forecast data for best model
            if (result.predictions && result.forecast_dates) {
              result.forecast_dates.forEach((date: string, idx: number) => {
                chartData.push({
                  date,
                  forecast: result.predictions[idx] || null,
                  lower_bound: result.lower_bound?.[idx] || null,
                  upper_bound: result.upper_bound?.[idx] || null,
                  is_forecast: true
                });
              });
            }
            
            // Set insights from API
            if (result.insights) {
              setInsights(result.insights);
            }
            
            // Set transformed result
            setForecastResult({
              ...result,
              chart_data: chartData
            });
            
            // Set initial chart data
            setCurrentChartData(chartData);
            
            // Set selected model data (best model)
            if (result.all_models && result.model_used) {
              const bestModelData = result.all_models[result.model_used];
              if (bestModelData) {
                setSelectedModelData(bestModelData);
              }
            }
            
            // Get target column from localStorage or result
            const uploadData = localStorage.getItem('uploadData');
            if (uploadData) {
              const data = JSON.parse(uploadData);
              setTargetColumn(data.targetColumn || 'Value');
            } else if (result.target_column) {
              setTargetColumn(result.target_column);
            }
            
            setIsLoading(false);
          } else if (statusResponse.status === 'failed') {
            // Stop polling
            isPollingRef.current = false;
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            toast.error('Forecast job failed');
            setIsLoading(false);
          }
        } catch (error: any) {
          console.error('Error polling forecast status:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Clear interval after 5 minutes
      timeoutRef.current = setTimeout(() => {
        // Only show error if we're still polling (not completed/failed)
        if (isPollingRef.current) {
          isPollingRef.current = false;
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.error('Forecast is taking longer than expected. Please check back later.');
          setIsLoading(false);
        }
      }, 300000);
    } catch (error: any) {
      isPollingRef.current = false;
      toast.error('Error loading forecast results: ' + (error.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!currentChartData || currentChartData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const csv = [
      ['Date', 'Actual', 'Forecast', 'Lower Bound', 'Upper Bound'].join(','),
      ...currentChartData.map(row => 
        [
          row.date, 
          row.actual ?? '', 
          row.forecast ?? '', 
          row.lower_bound ?? '', 
          row.upper_bound ?? ''
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${forecastId || 'forecast'}_${selectedModelData ? Object.keys(forecastResult?.all_models || {}).find(k => forecastResult?.all_models?.[k] === selectedModelData) : forecastResult?.model_used || 'auto'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const handleModelSelect = (modelName: string, modelData: ModelResult) => {
    setSelectedModelData(modelData);
    
    // Rebuild chart data with selected model's predictions
    if (!forecastResult) return;
    
    const newChartData: Array<{
      date: string;
      actual?: number | null;
      forecast?: number | null;
      lower_bound?: number | null;
      upper_bound?: number | null;
      is_forecast?: boolean;
    }> = [];
    
    // Add historical data
    if (forecastResult.historical_data && forecastResult.historical_data.length > 0) {
      forecastResult.historical_data.forEach((point: any) => {
        newChartData.push({
          date: point.date,
          actual: point.actual,
          is_forecast: false
        });
      });
    }
    
    // Add selected model's forecast data
    if (forecastResult.forecast_dates && modelData.predictions) {
      forecastResult.forecast_dates.forEach((date: string, idx: number) => {
        newChartData.push({
          date,
          forecast: modelData.predictions[idx] || null,
          lower_bound: modelData.lower_bound?.[idx] || null,
          upper_bound: modelData.upper_bound?.[idx] || null,
          is_forecast: true
        });
      });
    }
    
    setCurrentChartData(newChartData);
  };

  const handleExportChart = async () => {
    if (!currentChartData || currentChartData.length === 0) {
      toast.error('No chart data to export');
      return;
    }
    
    try {
      // Try to use html2canvas if available
      let html2canvas: any = null;
      try {
        // Dynamic import with error handling - use eval to avoid TypeScript error
        const html2canvasModule = await eval('import("html2canvas")').catch(() => null);
        html2canvas = html2canvasModule?.default || null;
      } catch {
        // Module not available - will use fallback
      }
      
      if (html2canvas) {
        // Get the chart element
        const chartElement = document.querySelector('.recharts-wrapper');
        if (chartElement) {
          const canvas = await html2canvas(chartElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
          });
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `forecast_chart_${forecastId || 'forecast'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('Chart exported successfully!');
          return;
        }
      }
      
      // Fallback: try to download from backend if chart_path exists
      if (forecastResult?.chart_path) {
        // Construct backend URL for chart
        const chartUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/forecast/${forecastId}/chart`;
        window.open(chartUrl, '_blank');
        toast.success('Chart download started!');
      } else {
        toast.info('Chart export will use backend-generated image. For client-side export, install html2canvas.');
        // Still try CSV as fallback
        handleExportCSV();
      }
    } catch (error: any) {
      console.error('Chart export error:', error);
      toast.error('Chart export failed. Try CSV export instead.');
    }
  };

  const handleExportReport = () => {
    toast.info('PDF report export will be available soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            Generating your forecast... This may take a few moments.
          </p>
        </div>
      </div>
    );
  }

  if (!forecastResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">No forecast results available.</p>
          <Button onClick={() => router.push(createPageUrl('Upload'))} className="mt-4">
            Start New Forecast
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Forecast Results
              </h1>
              <p className="text-gray-600">
                Job ID: <span className="font-semibold">{jobId?.substring(0, 8)}...</span> • 
                Target: <span className="font-semibold">{targetColumn || 'N/A'}</span>
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border border-green-200 px-4 py-2 text-sm">
              {forecastResult.model_used?.toUpperCase() || 'AUTO'}
            </Badge>
          </div>
          <ExportButtons 
            onExportCSV={handleExportCSV}
            onExportChart={handleExportChart}
            onExportReport={handleExportReport}
          />
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
              <span className="font-medium text-gray-600">Upload</span>
            </div>
            <div className="w-16 h-1 bg-green-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
              <span className="font-medium text-gray-600">Configure</span>
            </div>
            <div className="w-16 h-1 bg-green-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
              <span className="font-medium text-gray-900">Results</span>
            </div>
          </div>
        </div>

        {/* Model Comparison Tabs */}
        {forecastResult.all_models && Object.keys(forecastResult.all_models).length > 1 && (
          <div className="mb-8">
            <ModelComparisonTabs
              allModels={forecastResult.all_models}
              bestModel={forecastResult.model_used || 'auto'}
              forecastDates={forecastResult.forecast_dates || []}
              historicalData={forecastResult.historical_data || []}
              onModelSelect={handleModelSelect}
              targetColumn={targetColumn}
            />
          </div>
        )}

        {/* Metrics */}
        <div className="mb-8">
          <MetricsCard metrics={selectedModelData?.metrics || forecastResult.metrics} />
        </div>

        {/* Chart */}
        {currentChartData && currentChartData.length > 0 && (
          <div className="mb-8">
            <ForecastChart data={currentChartData} targetColumn={targetColumn} />
          </div>
        )}

        {/* Insights */}
        <div className="mb-8">
          <InsightsPanel insights={insights} isLoading={isLoadingInsights} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(createPageUrl('Home'))}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => router.push(createPageUrl('Upload'))}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Upload className="w-4 h-4" />
            New Forecast
          </Button>
        </div>
      </div>
    </div>
  );
}
