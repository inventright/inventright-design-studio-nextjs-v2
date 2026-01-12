'use client';

import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useWordPressAuth();

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
            <div className="flex items-center gap-3 text-gray-600">
              <Settings className="w-5 h-5" />
              <p>Database connection required for full admin functionality</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
