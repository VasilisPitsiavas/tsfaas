'use client';

import React, { useState } from 'react';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { TrendingUp, Award } from 'lucide-react';

interface ModelMetrics {
  mae?: number;
  rmse?: number;
  mape?: number;
  accuracy?: number;
  aic?: number;
}

interface ModelResult {
  predictions: number[];
  lower_bound?: number[] | null;
  upper_bound?: number[] | null;
  metrics: ModelMetrics;
}

interface ModelComparisonTabsProps {
  allModels: Record<string, ModelResult>;
  bestModel: string;
  forecastDates: string[];
  historicalData: Array<{ date: string; actual: number | null; is_forecast: boolean }>;
  onModelSelect: (modelName: string, data: ModelResult) => void;
  targetColumn: string;
}

export default function ModelComparisonTabs({
  allModels,
  bestModel,
  forecastDates,
  historicalData,
  onModelSelect,
  targetColumn
}: ModelComparisonTabsProps) {
  const [selectedModel, setSelectedModel] = useState<string>(bestModel || Object.keys(allModels)[0] || 'auto');

  const handleTabClick = (modelName: string) => {
    setSelectedModel(modelName);
    const modelData = allModels[modelName];
    if (modelData) {
      onModelSelect(modelName, modelData);
    }
  };

  const formatMetric = (value: number | undefined, format: 'decimal' | 'percent' = 'decimal'): string => {
    if (value === undefined || value === null) return 'N/A';
    if (format === 'percent') {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toFixed(4);
  };

  const getModelDisplayName = (name: string): string => {
    const names: Record<string, string> = {
      'auto': 'Auto (Best)',
      'arima': 'ARIMA',
      'ets': 'ETS',
      'xgboost': 'XGBoost'
    };
    return names[name.toLowerCase()] || name.toUpperCase();
  };

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Model Comparison
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Compare performance across different forecasting models
        </p>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {Object.keys(allModels).map((modelName) => {
            const isBest = modelName === bestModel;
            const isSelected = modelName === selectedModel;
            
            return (
              <button
                key={modelName}
                onClick={() => handleTabClick(modelName)}
                className={`
                  px-4 py-2 rounded-t-lg font-medium transition-all relative
                  ${isSelected 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {getModelDisplayName(modelName)}
                  {isBest && (
                    <Award className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Model</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">MAE</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">RMSE</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">MAPE</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(allModels).map(([modelName, modelData]) => {
                const isBest = modelName === bestModel;
                const metrics = modelData.metrics || {};
                
                return (
                  <tr
                    key={modelName}
                    className={`
                      border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${isBest ? 'bg-blue-50 font-semibold' : ''}
                    `}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={isBest ? 'text-blue-700' : 'text-gray-700'}>
                          {getModelDisplayName(modelName)}
                        </span>
                        {isBest && (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            Best
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatMetric(metrics.mae)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatMetric(metrics.rmse)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatMetric(metrics.mape, 'percent')}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatMetric(metrics.accuracy, 'percent')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Model Description */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Selected Model:</strong> {getModelDisplayName(selectedModel)}
            {selectedModel === bestModel && ' (Best performing model)'}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {selectedModel === 'arima' && 'ARIMA models capture autocorrelations in time series data, making them ideal for data with clear trends and seasonality.'}
            {selectedModel === 'ets' && 'Exponential Smoothing models are excellent for data with trends and seasonal patterns, providing smooth forecasts.'}
            {selectedModel === 'xgboost' && 'XGBoost uses machine learning to capture complex patterns and non-linear relationships in your data.'}
            {selectedModel === 'auto' && 'Automatically selected the best performing model based on lowest error metrics.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
