'use client';

import React from 'react';
import { Button } from '@/intfrontend/components/ui/button';
import { Download, FileDown, FileText } from 'lucide-react';

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportChart: () => void;
  onExportReport: () => void;
}

export default function ExportButtons({ onExportCSV, onExportChart, onExportReport }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button 
        onClick={onExportCSV}
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2"
      >
        <Download className="w-5 h-5" />
        Export CSV
      </Button>
      <Button 
        onClick={onExportChart}
        variant="outline"
        size="lg"
        className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 gap-2"
      >
        <FileDown className="w-5 h-5" />
        Export Chart
      </Button>
      <Button 
        onClick={onExportReport}
        variant="outline"
        size="lg"
        className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 gap-2"
      >
        <FileText className="w-5 h-5" />
        Export Report
      </Button>
    </div>
  );
}
