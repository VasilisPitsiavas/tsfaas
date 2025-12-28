'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/navigation';
import { api, JobInfo } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { Button } from '@/intfrontend/components/ui/button';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/intfrontend/components/ui/table';
import { Skeleton } from '@/intfrontend/components/ui/skeleton';
import { Upload, TrendingUp, FileSpreadsheet, Clock, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await api.jobs.list(50, 0);
      setJobs(response.jobs);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs: ' + (error.message || 'Unknown error'));
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ComponentType<any>; pulse?: boolean }> = {
      uploaded: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileSpreadsheet },
      configured: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
      processing: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Loader2, pulse: true },
      queued: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, pulse: true },
      started: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Loader2, pulse: true },
      completed: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      finished: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.uploaded;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 w-fit ${config.pulse ? 'animate-pulse' : ''}`}>
        <Icon className={`w-3.5 h-3.5 ${config.pulse ? 'animate-spin' : ''}`} />
        <span className="font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed' || j.status === 'finished').length,
    processing: jobs.filter(j => j.status === 'processing' || j.status === 'queued' || j.status === 'started').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
              Forecast Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage and view all your forecasting jobs
            </p>
          </div>
          <Link href={createPageUrl('Upload')}>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-6"
            >
              <Upload className="w-5 h-5" />
              New Forecast
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-600 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-green-600 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-gray-900">{stats.completed}</p>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-yellow-600 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-gray-900">{stats.processing}</p>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Recent Forecasts</CardTitle>
              </div>
              {!isLoading && jobs.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No forecasts yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by uploading your first time-series data file and generating a forecast.
                </p>
                <Link href={createPageUrl('Upload')}>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Create Your First Forecast
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">File Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job, idx) => (
                      <TableRow 
                        key={job.job_id} 
                        className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100"
                      >
                        <TableCell className="font-medium py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {job.file_name || `Job ${job.job_id.substring(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ID: {job.job_id.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {job.created_at ? (
                            <div>
                              <p className="font-medium">{format(new Date(job.created_at), 'MMM d, yyyy')}</p>
                              <p className="text-sm text-gray-500">{format(new Date(job.created_at), 'HH:mm')}</p>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          {job.status === 'completed' && job.forecast_id ? (
                            <Link href={createPageUrl('Results') + `?forecast_id=${job.forecast_id}&job_id=${job.job_id}`}>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                              >
                                View Results
                              </Button>
                            </Link>
                          ) : job.status === 'uploaded' ? (
                            <Link href={createPageUrl('Configure') + `?job_id=${job.job_id}`}>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                              >
                                Configure
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              disabled
                              className="text-gray-400"
                            >
                              {job.status}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
