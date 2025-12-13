'use client';

import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/navigation';
import { Button } from '@/intfrontend/components/ui/button';
import { Card, CardContent } from '@/intfrontend/components/ui/card';
import { TrendingUp, Upload, BarChart3, Download, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Time Series Forecasting as a Service
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Data Into
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Future Insights</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Upload your time-series data and get professional forecasts in minutes. 
            No coding. No statistics knowledge. Just instant, reliable predictions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={createPageUrl('Upload')}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 gap-2">
                <Upload className="w-5 h-5" />
                Start Forecasting
              </Button>
            </Link>
            <Link href={createPageUrl('Dashboard')}>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-lg px-8 py-6"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features, Simple Interface
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need for professional time-series forecasting
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy Upload</h3>
              <p className="text-gray-600">
                Drag and drop your CSV file. We automatically detect columns and validate your data structure.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-purple-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multiple Models</h3>
              <p className="text-gray-600">
                Choose from ARIMA, ETS, XGBoost, or let our system automatically select the best model.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-green-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Beautiful Charts</h3>
              <p className="text-gray-600">
                Interactive visualizations with confidence intervals, metrics, and AI-powered insights.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-orange-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Export Results</h3>
              <p className="text-gray-600">
                Download your forecasts as CSV, export charts as images, or generate PDF reports.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-red-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is encrypted and stored securely. Only you have access to your forecasts and files.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-indigo-600">
            <CardContent className="pt-8">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">REST API</h3>
              <p className="text-gray-600">
                Integrate forecasting into your applications with our simple and powerful REST API.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to forecast the future?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of businesses making data-driven decisions with Forecastly
            </p>
            <Link href={createPageUrl('Upload')}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 gap-2">
                <Upload className="w-5 h-5" />
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
