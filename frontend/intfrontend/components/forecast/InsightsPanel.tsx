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
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {insights}
          </div>
        ) : (
          <p className="text-gray-500">No insights available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
