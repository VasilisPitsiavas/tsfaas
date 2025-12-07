'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ColumnSelectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('job_id');
  
  const [columns, setColumns] = useState<string[]>([]);
  const [timeCandidates, setTimeCandidates] = useState<Array<{column: string; score: number}>>([]);
  const [selectedTimeColumn, setSelectedTimeColumn] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedExogenous, setSelectedExogenous] = useState<string[]>([]);
  const [horizon, setHorizon] = useState<number>(14);
  const [model, setModel] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setIsLoading(false);
      return;
    }

    const fetchUploadInfo = async () => {
      try {
        const data = await api.upload.get(jobId);
        setColumns(data.columns || []);
        setTimeCandidates(data.time_candidates || []);
        setPreview(data.preview || []);
        
        // Auto-select best time column candidate
        if (data.time_candidates && data.time_candidates.length > 0) {
          setSelectedTimeColumn(data.time_candidates[0].column);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load upload information');
        setIsLoading(false);
      }
    };

    fetchUploadInfo();
  }, [jobId]);

  const handleSubmit = async () => {
    if (!selectedTarget || !jobId || !selectedTimeColumn) {
      setError('Please select time column and target column');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.forecast.create({
        job_id: jobId,
        time_column: selectedTimeColumn,
        target_column: selectedTarget,
        exogenous: selectedExogenous.length > 0 ? selectedExogenous : undefined,
        horizon: horizon,
        model: model,
      });

      // Navigate to results page
      router.push(`/results?forecast_id=${response.forecast_id}&job_id=${jobId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create forecast');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading column information...</p>
      </div>
    );
  }

  if (error && !columns.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/upload')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Get available columns for target (exclude time column)
  const availableTargetColumns = columns.filter(
    col => col !== selectedTimeColumn
  );

  // Get available columns for exogenous (exclude time and target)
  const availableExogenousColumns = columns.filter(
    col => col !== selectedTimeColumn && col !== selectedTarget
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Configure Forecast</h1>
        <p className="text-gray-600 mb-8">Select your columns and forecast parameters</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Preview Table */}
        {preview.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Data Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {columns.map((col) => (
                      <th key={col} className="text-left p-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {columns.map((col) => (
                        <td key={col} className="p-2">
                          {row[col] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Time Column Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Time Column <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTimeColumn}
              onChange={(e) => setSelectedTimeColumn(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select time column</option>
              {timeCandidates.map((candidate) => (
                <option key={candidate.column} value={candidate.column}>
                  {candidate.column} (confidence: {candidate.score})
                </option>
              ))}
              {columns
                .filter(col => !timeCandidates.some(tc => tc.column === col))
                .map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
            </select>
          </div>

          {/* Target Column Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Column <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select target column</option>
              {availableTargetColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Exogenous Columns */}
          {availableExogenousColumns.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Exogenous Columns (Optional)
              </label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {availableExogenousColumns.map((col) => (
                  <label key={col} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Forecast Horizon */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Forecast Horizon (days)
            </label>
            <input
              type="number"
              value={horizon}
              onChange={(e) => setHorizon(Math.max(1, Math.min(365, parseInt(e.target.value) || 14)))}
              min="1"
              max="365"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Number of future periods to forecast (1-365)</p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Forecasting Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="auto">Auto (Best Model)</option>
              <option value="arima">ARIMA</option>
              <option value="ets">ETS (Exponential Smoothing)</option>
              <option value="xgboost">XGBoost</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {model === 'auto' 
                ? 'Automatically selects the best performing model'
                : `Uses ${model.toUpperCase()} model exclusively`}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={!selectedTarget || !selectedTimeColumn || isSubmitting}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? 'Creating Forecast...' : 'Create Forecast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
