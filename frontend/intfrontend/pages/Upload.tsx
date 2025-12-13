'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/navigation';
import { api } from '@/lib/api';
import Papa from 'papaparse';
import { Button } from '@/intfrontend/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import FileUploader from '@/intfrontend/components/forecast/FileUploader';
import DataPreview from '@/intfrontend/components/forecast/DataPreview';
import { toast } from 'sonner';

export default function Upload() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [detectedTimeColumn, setDetectedTimeColumn] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const detectTimeColumn = (cols: string[], data: Record<string, any>[]): string | null => {
    const timeKeywords = ['date', 'time', 'datetime', 'timestamp', 'period', 'year', 'month', 'day'];
    const detected = cols.find(col => 
      timeKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );
    return detected || cols[0] || null;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: true,
        download: false,
        worker: false,
      });
      
      const cols = result.meta.fields || [];
      const preview = result.data.slice(0, 10) as Record<string, any>[];
      
      setColumns(cols);
      setParsedData(preview);
      setDetectedTimeColumn(detectTimeColumn(cols, preview));
      setIsProcessing(false);
      toast.success('File parsed successfully!');
    };
    reader.onerror = () => {
      toast.error('Error reading file');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleContinue = async () => {
    if (!selectedFile || !parsedData) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Starting file upload...', { fileName: selectedFile.name, size: selectedFile.size });
      
      // Upload file to backend
      const uploadResponse = await api.upload.post(selectedFile);
      
      console.log('Upload response received:', uploadResponse);
      
      if (!uploadResponse || !uploadResponse.job_id) {
        throw new Error('Invalid response from server: missing job_id');
      }
      
      // Store job_id in localStorage for navigation
      localStorage.setItem('currentJobId', uploadResponse.job_id);
      localStorage.setItem('uploadData', JSON.stringify({
        columns: uploadResponse.columns,
        preview: uploadResponse.preview,
        timeCandidates: uploadResponse.time_candidates,
        detectedTimeColumn: uploadResponse.time_candidates?.[0]?.column || detectedTimeColumn
      }));

      toast.success('Upload complete! Redirecting to configuration...');
      
      // Small delay to ensure state is saved and toast is visible
      const configureUrl = createPageUrl('Configure') + `?job_id=${uploadResponse.job_id}`;
      console.log('Navigating to:', configureUrl);
      
      setTimeout(() => {
        router.push(configureUrl);
      }, 300);
    } catch (error: any) {
      console.error('Upload error details:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Unknown error occurred';
      
      toast.error(`Error uploading file: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Time Series Data
          </h1>
          <p className="text-lg text-gray-600">
            Upload a CSV file containing your time-series data to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <span className="font-medium text-gray-900">Upload</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium text-gray-500">Configure</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <span className="font-medium text-gray-500">Results</span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <FileUploader 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={() => {
              setSelectedFile(null);
              setParsedData(null);
              setColumns([]);
              setDetectedTimeColumn(null);
            }}
          />
        </div>

        {/* Data Preview */}
        {parsedData && (
          <div className="mb-8">
            <DataPreview 
              data={parsedData}
              columns={columns}
              detectedTimeColumn={detectedTimeColumn || undefined}
            />
          </div>
        )}

        {/* Continue Button */}
        {parsedData && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Configuration
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
