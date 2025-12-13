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
        className="bg-blue-600 hover:bg-blue-700 gap-2"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
      <Button 
        onClick={onExportChart}
        variant="outline"
        className="gap-2"
      >
        <FileDown className="w-4 h-4" />
        Export Chart
      </Button>
      <Button 
        onClick={onExportReport}
        variant="outline"
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        Export Report
      </Button>
    </div>
  );
}
