'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const forecastId = searchParams.get('forecast_id');
  
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (!forecastId) return;

    // TODO: Poll for forecast results
    // - GET /api/forecast/{forecast_id}/status
    // - If completed, GET /api/forecast/{forecast_id}
    // - Update forecastData state
    // - Handle loading and error states
    
    const fetchForecast = async () => {
      // Placeholder: simulate API call
      setTimeout(() => {
        setLoading(false);
        // setForecastData(...);
      }, 1000);
    };

    fetchForecast();
  }, [forecastId]);

  const handleExportCSV = () => {
    // TODO: Export forecast results as CSV
  };

  const handleExportChart = () => {
    // TODO: Export chart as image
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading forecast results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Forecast Results</h1>
        
        {/* TODO: Model comparison tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b">
            <button className="px-4 py-2 border-b-2 border-primary-600">
              All Models
            </button>
          </div>
        </div>

        {/* TODO: Interactive chart using Recharts */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Forecast Visualization</h2>
          <div className="h-96 flex items-center justify-center border-2 border-dashed">
            Chart will be rendered here
          </div>
        </div>

        {/* TODO: Summary metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">MAE</h3>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">RMSE</h3>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Model Used</h3>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleExportCSV}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportChart}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Export Chart
          </button>
        </div>
      </div>
    </div>
  );
}

