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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing first {data.length} rows • {columns.length} columns detected
            </p>
          </div>
          {detectedTimeColumn && (
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              <Calendar className="w-3 h-3 mr-1" />
              Time column: {detectedTimeColumn}
            </Badge>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead key={col} className="font-semibold text-gray-700">
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
              <TableRow key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <TableCell key={col} className="text-gray-700">
                    {row[col] ?? ''}
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
