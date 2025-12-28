'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';

interface InsightsPanelProps {
  insights?: string | null;
  isLoading?: boolean;
}

export default function InsightsPanel({ insights, isLoading }: InsightsPanelProps) {
  return (
    <Card className="shadow-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="border-b border-yellow-200 bg-gradient-to-r from-yellow-50 to-white pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
          </div>
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center gap-4 text-gray-600 py-4">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
            <span className="font-medium">Analyzing your forecast data...</span>
          </div>
        ) : insights ? (
          <div className="space-y-4 text-gray-700">
            {insights.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed text-base">
                {paragraph.split('**').map((part, partIdx) => {
                  // Simple markdown bold handling
                  if (partIdx % 2 === 1) {
                    return <strong key={partIdx} className="font-bold text-gray-900">{part}</strong>;
                  }
                  return <React.Fragment key={partIdx}>{part}</React.Fragment>;
                })}
              </p>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 font-medium">No insights available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
