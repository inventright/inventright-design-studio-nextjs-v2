'use client';

import { useState, useEffect } from 'react';
import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Job {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  packageType: string | null;
}

export default function ManagerDashboard() {
  const { user } = useWordPressAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [allManagers, setAllManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.role === 'admin') {
      setIsAdmin(true);
    }
  }, [user]);

  // Fetch all managers for admin dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      if (!isAdmin) return;

      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const managers = data.users.filter((u: any) => u.role === 'manager');
            setAllManagers(managers);
          }
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    };

    fetchManagers();
  }, [isAdmin]);

  // Fetch jobs for the manager
  useEffect(() => {
    const fetchJobs = async () => {
      const targetUserId = isAdmin && selectedManagerId && selectedManagerId !== 'all' ? selectedManagerId : user?.id;
      if (!targetUserId) {
        setLoadingJobs(false);
        return;
      }

      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [user, isAdmin, selectedManagerId]);

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name || user?.email || "Manager"}</p>
          
          {/* Admin Manager Selector */}
          {isAdmin && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">View Manager:</label>
              <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                  {allManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>Oversee all design projects and team assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-600">Loading projects...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects available</h3>
                <p className="text-gray-600 max-w-md">
                  {isAdmin && selectedManagerId 
                    ? "This manager has no assigned projects yet."
                    : "No projects have been assigned yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const statusColors: Record<string, string> = {
                    Draft: 'bg-gray-100 text-gray-800',
                    Pending: 'bg-yellow-100 text-yellow-800',
                    'In Progress': 'bg-blue-100 text-blue-800',
                    Review: 'bg-purple-100 text-purple-800',
                    Completed: 'bg-green-100 text-green-800',
                  };
                  
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {job.packageType && (
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {job.packageType}
                            </span>
                          )}
                          <span>Priority: {job.priority}</span>
                          <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
