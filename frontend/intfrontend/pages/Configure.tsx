'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/lib/navigation';
import { api } from '@/lib/api';
import { Button } from '@/intfrontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { ArrowRight, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import ColumnSelector from '@/intfrontend/components/forecast/ColumnSelector';
import { toast } from 'sonner';

interface UploadData {
  columns: string[];
  preview: any[];
  timeCandidates?: Array<{ column: string; score: number }>;
  detectedTimeColumn?: string;
}

export default function Configure() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [timeColumn, setTimeColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [exogenousColumns, setExogenousColumns] = useState<string[]>([]);
  const [horizon, setHorizon] = useState(14);
  const [model, setModel] = useState('auto');

  useEffect(() => {
    const jobIdParam = searchParams.get('job_id');
    
    if (jobIdParam) {
      setJobId(jobIdParam);
      loadUploadData(jobIdParam);
    } else {
      // Try to get from localStorage
      const storedJobId = localStorage.getItem('currentJobId');
      const storedData = localStorage.getItem('uploadData');
      
      if (storedJobId && storedData) {
        setJobId(storedJobId);
        setUploadData(JSON.parse(storedData));
        setIsLoading(false);
      } else {
        toast.error('No job ID provided');
        router.push(createPageUrl('Upload'));
      }
    }
  }, [searchParams, router]);

  const loadUploadData = async (jobId: string) => {
    try {
      const response = await api.upload.get(jobId);
      const data: UploadData = {
        columns: response.columns,
        preview: response.preview,
        timeCandidates: response.time_candidates,
        detectedTimeColumn: response.time_candidates?.[0]?.column || response.columns[0]
      };
      setUploadData(data);
      setTimeColumn(data.detectedTimeColumn || data.columns[0]);
      setIsLoading(false);
    } catch (error: any) {
      toast.error('Error loading upload data: ' + (error.message || 'Unknown error'));
      router.push(createPageUrl('Upload'));
    }
  };

  const handleExogenousToggle = (col: string) => {
    setExogenousColumns(prev => 
      prev.includes(col) 
        ? prev.filter(c => c !== col)
        : [...prev, col]
    );
  };

  const handleRunForecast = async () => {
    if (!timeColumn || !targetColumn || !jobId) {
      toast.error('Please select time and target columns');
      return;
    }

    setIsProcessing(true);
    try {
      // Create forecast job
      const forecastResponse = await api.forecast.create({
        job_id: jobId,
        time_column: timeColumn,
        target_column: targetColumn,
        exogenous: exogenousColumns.length > 0 ? exogenousColumns : undefined,
        horizon: horizon,
        model: model
      });

      // Store target column for Results page
      const uploadData = localStorage.getItem('uploadData');
      if (uploadData) {
        const data = JSON.parse(uploadData);
        data.targetColumn = targetColumn;
        localStorage.setItem('uploadData', JSON.stringify(data));
      }
      
      toast.success('Forecast job created! Redirecting to results...');
      router.push(createPageUrl('Results') + `?forecast_id=${forecastResponse.forecast_id}&job_id=${jobId}`);
    } catch (error: any) {
      toast.error('Error creating forecast: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  if (isLoading || !uploadData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Configure Your Forecast
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Select columns and parameters for your forecast
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:inline">Upload</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-blue-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shadow-lg">
                2
              </div>
              <span className="font-bold text-gray-900 hidden sm:inline">Configure</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <span className="font-medium text-gray-500 hidden sm:inline">Results</span>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <Card className="shadow-xl mb-10 border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Forecast Configuration</CardTitle>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Job ID: <span className="font-semibold text-gray-900 font-mono">{jobId?.substring(0, 12)}...</span>
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <ColumnSelector
              columns={uploadData.columns}
              timeColumn={timeColumn}
              targetColumn={targetColumn}
              exogenousColumns={exogenousColumns}
              horizon={horizon}
              model={model}
              onTimeColumnChange={setTimeColumn}
              onTargetColumnChange={setTargetColumn}
              onExogenousToggle={handleExogenousToggle}
              onHorizonChange={setHorizon}
              onModelChange={setModel}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(createPageUrl('Upload'))}
            disabled={isProcessing}
            className="border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          >
            Back to Upload
          </Button>
          <Button
            size="lg"
            onClick={handleRunForecast}
            disabled={isProcessing || !timeColumn || !targetColumn}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Forecast
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
