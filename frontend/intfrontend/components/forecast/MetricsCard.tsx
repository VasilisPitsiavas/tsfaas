'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface Metrics {
  mae?: number;
  rmse?: number;
  mape?: number;
  accuracy?: number;
}

interface MetricsCardProps {
  metrics?: Metrics | null;
}

export default function MetricsCard({ metrics }: MetricsCardProps) {
  if (!metrics) return null;

  const metricItems = [
    {
      label: 'Mean Absolute Error',
      value: metrics.mae?.toFixed(2) || 'N/A',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Root Mean Squared Error',
      value: metrics.rmse?.toFixed(2) || 'N/A',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Mean Absolute % Error',
      value: metrics.mape ? `${metrics.mape.toFixed(1)}%` : 'N/A',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Model Accuracy',
      value: metrics.accuracy ? `${metrics.accuracy.toFixed(1)}%` : 'N/A',
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricItems.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={idx} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  {metric.label}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${metric.bgColor} shadow-sm`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
