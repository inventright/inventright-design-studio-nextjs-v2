'use client';

import { useState, useEffect } from 'react';
import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface JobDetailProps {
  params: { id: string };
}

interface Job {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  packageType: string | null;
  clientId: number;
  designerId: number | null;
  departmentId: number | null;
  isDraft: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobFile {
  id: number;
  jobId: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedAt: string;
}

export default function JobDetail({ params }: JobDetailProps) {
  const { user } = useWordPressAuth();
  const jobId = params.id;
  const [job, setJob] = useState<Job | null>(null);
  const [files, setFiles] = useState<JobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Get auth credentials
        const authToken = localStorage.getItem('auth_token') || localStorage.getItem('wordpress_token');
        const userData = localStorage.getItem('user_data');
        
        // Build headers with authentication
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        if (userData) {
          headers['X-User-Data'] = userData;
        }
        
        // Fetch job details
        const jobRes = await fetch(`/api/jobs/${jobId}`, {
          headers,
          credentials: 'include',
        });
        if (!jobRes.ok) {
          throw new Error('Failed to fetch job details');
        }
        const jobData = await jobRes.json();
        setJob(jobData);

        // Fetch job files
        const filesRes = await fetch(`/api/files?jobId=${jobId}`, {
          headers,
          credentials: 'include',
        });
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          setFiles(filesData);
        }
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const parseDescription = (description: string | null) => {
    if (!description) return null;
    try {
      return JSON.parse(description);
    } catch {
      return { raw: description };
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Review': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-8 max-w-7xl mx-auto pt-24">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading job details...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <Header />
        <div className="p-8 max-w-7xl mx-auto pt-24">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Not Found</CardTitle>
              <CardDescription>Job ID: {jobId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job details unavailable</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  {error || 'The requested job could not be found.'}
                </p>
                <Link href="/dashboard">
                  <Button variant="outline">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const parsedDescription = parseDescription(job.description);

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Job Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <CardDescription>Job ID: {job.id}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  {job.isDraft && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium">{job.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Package Type</p>
                  <p className="font-medium">{job.packageType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Updated</p>
                  <p className="font-medium">{new Date(job.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          {parsedDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(parsedDescription).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attached Files</CardTitle>
                <CardDescription>{files.length} file(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a href={file.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
