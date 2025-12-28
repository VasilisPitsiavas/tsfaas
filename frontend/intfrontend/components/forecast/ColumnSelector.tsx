'use client';

import React from 'react';
import { Label } from '@/intfrontend/components/ui/label';
import { Select } from '@/intfrontend/components/ui/select';
import { Input } from '@/intfrontend/components/ui/input';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Calendar, Target, Layers, TrendingUp } from 'lucide-react';
import { Button } from '@/intfrontend/components/ui/button';

interface ColumnSelectorProps {
  columns: string[];
  timeColumn: string;
  targetColumn: string;
  exogenousColumns: string[];
  horizon: number;
  model: string;
  onTimeColumnChange: (value: string) => void;
  onTargetColumnChange: (value: string) => void;
  onExogenousToggle: (col: string) => void;
  onHorizonChange: (value: number) => void;
  onModelChange: (value: string) => void;
}

export default function ColumnSelector({ 
  columns, 
  timeColumn, 
  targetColumn, 
  exogenousColumns,
  horizon,
  model,
  onTimeColumnChange,
  onTargetColumnChange,
  onExogenousToggle,
  onHorizonChange,
  onModelChange
}: ColumnSelectorProps) {
  return (
    <div className="space-y-8">
      {/* Time Column */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2.5 text-gray-900">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          Time Column
        </Label>
        <Select 
          value={timeColumn} 
          onChange={(e) => onTimeColumnChange(e.target.value)} 
          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
        >
          <option value="">Select time/date column</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </Select>
        <p className="text-sm text-gray-600 font-medium">
          The column containing your timestamps or dates
        </p>
      </div>

      {/* Target Column */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2.5 text-gray-900">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Target className="w-4 h-4 text-green-600" />
          </div>
          Target Column
        </Label>
        <Select 
          value={targetColumn} 
          onChange={(e) => onTargetColumnChange(e.target.value)} 
          className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
        >
          <option value="">Select column to forecast</option>
          {columns.filter(col => col !== timeColumn).map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </Select>
        <p className="text-sm text-gray-600 font-medium">
          The metric you want to forecast (e.g., sales, revenue)
        </p>
      </div>

      {/* Exogenous Features */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2.5 text-gray-900">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          Additional Features (Optional)
        </Label>
        <div className="flex flex-wrap gap-2.5">
          {columns
            .filter(col => col !== timeColumn && col !== targetColumn)
            .map((col) => {
              const isSelected = exogenousColumns.includes(col);
              return (
                <Badge
                  key={col}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 px-4 py-2 text-sm font-semibold ${
                    isSelected 
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md scale-105" 
                      : "bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300"
                  }`}
                  onClick={() => onExogenousToggle(col)}
                >
                  {col}
                </Badge>
              );
            })}
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Click to select additional variables that might influence your forecast
        </p>
      </div>

      {/* Forecast Horizon */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2.5 text-gray-900">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          Forecast Horizon
        </Label>
        <Input
          type="number"
          min="1"
          max="365"
          value={horizon}
          onChange={(e) => onHorizonChange(parseInt(e.target.value) || 14)}
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
        />
        <p className="text-sm text-gray-600 font-medium">
          Number of periods to forecast ahead (1-365)
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2.5 text-gray-900">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          Forecasting Model
        </Label>
        <Select 
          value={model} 
          onChange={(e) => onModelChange(e.target.value)} 
          className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
        >
          <option value="auto">Auto (Best Model)</option>
          <option value="arima">ARIMA</option>
          <option value="ets">ETS</option>
          <option value="xgboost">XGBoost</option>
        </Select>
        <p className="text-sm text-gray-600 font-medium">
          Choose a specific model or let the system select the best one automatically
        </p>
      </div>
    </div>
  );
}
