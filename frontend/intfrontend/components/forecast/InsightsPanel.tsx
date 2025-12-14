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
    <Card className="shadow-lg border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing your forecast data...</span>
          </div>
        ) : insights ? (
          <div className="space-y-3 text-gray-700">
            {insights.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed">
                {paragraph.split('**').map((part, partIdx) => {
                  // Simple markdown bold handling
                  if (partIdx % 2 === 1) {
                    return <strong key={partIdx} className="font-semibold text-gray-900">{part}</strong>;
                  }
                  return <React.Fragment key={partIdx}>{part}</React.Fragment>;
                })}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No insights available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
