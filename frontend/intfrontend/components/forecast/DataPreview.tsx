'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/intfrontend/components/ui/table';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Calendar } from 'lucide-react';

interface DataPreviewProps {
  data: Record<string, any>[];
  columns: string[];
  detectedTimeColumn?: string | null;
}

export default function DataPreview({ data, columns, detectedTimeColumn }: DataPreviewProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">Data Preview</h3>
            <p className="text-sm text-gray-600 font-medium">
              Showing first {data.length} rows • {columns.length} columns detected
            </p>
          </div>
          {detectedTimeColumn && (
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 text-sm font-semibold w-fit">
              <Calendar className="w-4 h-4 mr-2" />
              Time column: {detectedTimeColumn}
            </Badge>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {columns.map((col) => (
                <TableHead key={col} className="font-bold text-gray-700 py-4">
                  <div className="flex items-center gap-2">
                    {col === detectedTimeColumn && (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    )}
                    {col}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow 
                key={idx} 
                className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100"
              >
                {columns.map((col) => (
                  <TableCell key={col} className="text-gray-700 py-3 font-medium">
                    {row[col] ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
