'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/navigation';
import { api, JobInfo } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/intfrontend/components/ui/card';
import { Button } from '@/intfrontend/components/ui/button';
import { Badge } from '@/intfrontend/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/intfrontend/components/ui/table';
import { Upload, TrendingUp, FileSpreadsheet, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
    const statusConfig: Record<string, { color: string; icon: React.ComponentType<any> }> = {
      uploaded: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileSpreadsheet },
      configured: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
      processing: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Loader2 },
      queued: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      started: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Loader2 },
      completed: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      finished: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.uploaded;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    processing: jobs.filter(j => j.status === 'processing' || j.status === 'queued' || j.status === 'started').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Forecast Dashboard
            </h1>
            <p className="text-gray-600">
              Manage and view all your forecasting jobs
            </p>
          </div>
          <Link href={createPageUrl('Upload')}>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" />
              New Forecast
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-green-600">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-yellow-600">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900">{stats.processing}</p>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading forecasts...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No forecasts yet</p>
                <Link href={createPageUrl('Upload')}>
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Upload className="w-4 h-4" />
                    Create Your First Forecast
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.job_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                            {job.file_name || job.job_id.substring(0, 8) + '...'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {job.status === 'completed' && job.forecast_id ? (
                            <Link href={createPageUrl('Results') + `?forecast_id=${job.forecast_id}&job_id=${job.job_id}`}>
                              <Button size="sm" variant="outline">
                                View Results
                              </Button>
                            </Link>
                          ) : job.status === 'uploaded' ? (
                            <Link href={createPageUrl('Configure') + `?job_id=${job.job_id}`}>
                              <Button size="sm" variant="outline">
                                Configure
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
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
