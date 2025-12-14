'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
  is_forecast?: boolean;
}

interface ForecastChartProps {
  data: ChartDataPoint[];
  targetColumn: string;
}

export default function ForecastChart({ data, targetColumn }: ForecastChartProps) {
  if (!data || data.length === 0) return null;

  const forecastStartIndex = data.findIndex(d => d.is_forecast);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Forecast Results - {targetColumn}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            {forecastStartIndex >= 0 && (
              <ReferenceLine 
                x={data[forecastStartIndex]?.date} 
                stroke="#f59e0b" 
                strokeDasharray="3 3"
                label={{ value: 'Forecast starts', position: 'top', fill: '#f59e0b' }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Historical"
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
            />
            <Line 
              type="monotone" 
              dataKey="lower_bound" 
              stroke="#94a3b8" 
              strokeWidth={1}
              dot={false}
              name="Lower Bound"
            />
            <Line 
              type="monotone" 
              dataKey="upper_bound" 
              stroke="#94a3b8" 
              strokeWidth={1}
              dot={false}
              name="Upper Bound"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
