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
    <div className="space-y-6">
      {/* Time Column */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <Calendar className="w-5 h-5 text-blue-600" />
          Time Column
        </Label>
        <Select value={timeColumn} onChange={(e) => onTimeColumnChange(e.target.value)} className="h-12">
          <option value="">Select time/date column</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </Select>
        <p className="text-sm text-gray-500">
          The column containing your timestamps or dates
        </p>
      </div>

      {/* Target Column */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <Target className="w-5 h-5 text-green-600" />
          Target Column
        </Label>
        <Select value={targetColumn} onChange={(e) => onTargetColumnChange(e.target.value)} className="h-12">
          <option value="">Select column to forecast</option>
          {columns.filter(col => col !== timeColumn).map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </Select>
        <p className="text-sm text-gray-500">
          The metric you want to forecast (e.g., sales, revenue)
        </p>
      </div>

      {/* Exogenous Features */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <Layers className="w-5 h-5 text-purple-600" />
          Additional Features (Optional)
        </Label>
        <div className="flex flex-wrap gap-2">
          {columns
            .filter(col => col !== timeColumn && col !== targetColumn)
            .map((col) => {
              const isSelected = exogenousColumns.includes(col);
              return (
                <Badge
                  key={col}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => onExogenousToggle(col)}
                >
                  {col}
                </Badge>
              );
            })}
        </div>
        <p className="text-sm text-gray-500">
          Click to select additional variables that might influence your forecast
        </p>
      </div>

      {/* Forecast Horizon */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          Forecast Horizon
        </Label>
        <Input
          type="number"
          min="1"
          max="365"
          value={horizon}
          onChange={(e) => onHorizonChange(parseInt(e.target.value) || 14)}
          className="h-12"
        />
        <p className="text-sm text-gray-500">
          Number of periods to forecast ahead (1-365)
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Forecasting Model
        </Label>
        <Select value={model} onChange={(e) => onModelChange(e.target.value)} className="h-12">
          <option value="auto">Auto (Best Model)</option>
          <option value="arima">ARIMA</option>
          <option value="ets">ETS</option>
          <option value="xgboost">XGBoost</option>
        </Select>
        <p className="text-sm text-gray-500">
          Choose a specific model or let the system select the best one automatically
        </p>
      </div>
    </div>
  );
}
