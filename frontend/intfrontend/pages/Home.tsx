'use client';

import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/navigation';
import { Button } from '@/intfrontend/components/ui/button';
import { Card, CardContent } from '@/intfrontend/components/ui/card';
import { TrendingUp, Upload, BarChart3, Download, Zap, Shield, Globe, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-md hover:shadow-lg transition-shadow">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Time Series Forecasting as a Service</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
            Transform Your Data Into
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Future Insights
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            Upload your time-series data and get professional forecasts in minutes. 
            <br className="hidden md:block" />
            <span className="text-gray-500">No coding. No statistics knowledge. Just instant, reliable predictions.</span>
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-16">
            <Link href={createPageUrl('Upload')}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-10 py-7 gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Upload className="w-6 h-6" />
                Start Forecasting
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href={createPageUrl('Dashboard')}>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 hover:border-gray-400 text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">&lt;1min</div>
              <div className="text-sm text-gray-600">Forecast Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-sm text-gray-600">Forecasts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simple Interface
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need for professional time-series forecasting, all in one place
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-blue-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Easy Upload</h3>
              <p className="text-gray-600 leading-relaxed">
                Drag and drop your CSV file. We automatically detect columns and validate your data structure with intelligent parsing.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-purple-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Multiple Models</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from ARIMA, ETS, XGBoost, or let our AI automatically select the best model for your data.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-green-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Beautiful Charts</h3>
              <p className="text-gray-600 leading-relaxed">
                Interactive visualizations with confidence intervals, metrics, and AI-powered insights that tell a story.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-orange-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Export Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Download forecasts as CSV, export charts as high-quality images, or generate comprehensive PDF reports.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-red-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is encrypted and stored securely. Only you have access to your forecasts and files with enterprise-grade security.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-t-4 border-indigo-600 transform hover:-translate-y-2">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">REST API</h3>
              <p className="text-gray-600 leading-relaxed">
                Integrate forecasting into your applications with our simple, powerful REST API and comprehensive documentation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <Card className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="p-16 text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Trusted by data teams worldwide</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to forecast the future?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-blue-50 max-w-2xl mx-auto">
              Join thousands of businesses making data-driven decisions with Forecastly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={createPageUrl('Upload')}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-7 gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <Upload className="w-6 h-6" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href={createPageUrl('Dashboard')}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  View Examples
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
