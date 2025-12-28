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
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          Forecast Results - {targetColumn}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {forecastStartIndex >= 0 && (
              <ReferenceLine 
                x={data[forecastStartIndex]?.date} 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ 
                  value: 'Forecast starts', 
                  position: 'top', 
                  fill: '#f59e0b',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              name="Historical"
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#10b981" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
            />
            <Line 
              type="monotone" 
              dataKey="lower_bound" 
              stroke="#94a3b8" 
              strokeWidth={1.5}
              dot={false}
              name="Lower Bound"
            />
            <Line 
              type="monotone" 
              dataKey="upper_bound" 
              stroke="#94a3b8" 
              strokeWidth={1.5}
              dot={false}
              name="Upper Bound"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
