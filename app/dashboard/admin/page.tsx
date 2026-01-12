'use client';

import { useState, useEffect } from 'react';
import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database, Users, Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useWordPressAuth();
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    loading: true
  });

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        // Fetch users count
        const usersRes = await fetch('/api/users');
        let totalUsers = 0;
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          totalUsers = usersData.success ? usersData.users.length : 0;
        }

        // Fetch jobs stats
        const jobsRes = await fetch('/api/jobs');
        let totalJobs = 0;
        let activeJobs = 0;
        let completedJobs = 0;
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          totalJobs = jobsData.length;
          activeJobs = jobsData.filter((j: any) => 
            j.status === 'Pending' || j.status === 'In Progress' || j.status === 'Review'
          ).length;
          completedJobs = jobsData.filter((j: any) => j.status === 'Completed').length;
        }

        setSystemStats({
          totalUsers,
          totalJobs,
          activeJobs,
          completedJobs,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
        setSystemStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSystemStats();
  }, []);

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name || user?.email || "Admin"}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/email-templates">
                <Button variant="outline" className="w-full">
                  Manage Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vouchers</CardTitle>
              <CardDescription>Create and manage vouchers</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/vouchers">
                <Button variant="outline" className="w-full">
                  Manage Vouchers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Survey Results</CardTitle>
              <CardDescription>View customer survey responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/survey-results">
                <Button variant="outline" className="w-full">
                  View Results
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system information</CardDescription>
          </CardHeader>
          <CardContent>
            {systemStats.loading ? (
              <div className="flex items-center gap-3 text-gray-600">
                <Settings className="w-5 h-5 animate-spin" />
                <p>Loading system status...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="text-lg font-semibold text-gray-900">Connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-lg font-semibold text-gray-900">{systemStats.totalUsers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                    <p className="text-lg font-semibold text-gray-900">{systemStats.activeJobs} / {systemStats.totalJobs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-lg font-semibold text-gray-900">{systemStats.completedJobs}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
