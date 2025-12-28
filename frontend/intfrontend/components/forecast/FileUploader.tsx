'use client';

import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/intfrontend/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export default function FileUploader({ onFileSelect, selectedFile, onClear }: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].name.endsWith('.csv')) {
        onFileSelect(files[0]);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900 mb-1">{selectedFile.name}</p>
              <p className="text-sm text-gray-600 font-medium">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer bg-white shadow-sm",
        isDragging 
          ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg" 
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer w-full">
        <div className="flex flex-col items-center gap-5">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragging ? "bg-blue-200 scale-110" : "bg-blue-100"
          )}>
            <Upload className={cn(
              "w-10 h-10 text-blue-600 transition-transform duration-300",
              isDragging && "scale-110"
            )} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-bold text-gray-900">
              Drop your CSV file here
            </p>
            <p className="text-sm text-gray-600 font-medium">
              or click to browse
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-medium">CSV files only</span>
          </div>
        </div>
      </label>
    </div>
  );
}
