'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ColumnSelectionPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedExogenous, setSelectedExogenous] = useState<string[]>([]);
  const [horizon, setHorizon] = useState<number>(14);
  const [model, setModel] = useState<string>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // TODO: Fetch column information from backend using job_id
    // - GET /api/upload/{job_id}
    // - Set columns and detected time column
  }, [jobId]);

  const handleSubmit = async () => {
    if (!selectedTarget || !jobId) return;

    setIsSubmitting(true);
    // TODO: Submit forecast request
    // - POST /api/forecast
    // - Handle response
    // - Navigate to results page
    
    setTimeout(() => {
      setIsSubmitting(false);
      // Placeholder: navigate to results
      // router.push(`/results?forecast_id=${forecastId}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configure Forecast</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Target Column</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select target column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Exogenous Columns (Optional)
            </label>
            <div className="space-y-2">
              {columns.map((col) => (
                <label key={col} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedExogenous.includes(col)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExogenous([...selectedExogenous, col]);
                      } else {
                        setSelectedExogenous(selectedExogenous.filter((c) => c !== col));
                      }
                    }}
                  />
                  <span>{col}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Forecast Horizon (days)
            </label>
            <input
              type="number"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="auto">Auto (Best Model)</option>
              <option value="arima">ARIMA</option>
              <option value="ets">ETS</option>
              <option value="xgboost">XGBoost</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedTarget || isSubmitting}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Forecast...' : 'Create Forecast'}
          </button>
        </div>
      </div>
    </div>
  );
}

