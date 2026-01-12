'use client';

import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  const { user } = useWordPressAuth();

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">System analytics and reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>View system metrics and performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics unavailable</h3>
              <p className="text-gray-600 max-w-md">
                Database connection required to view analytics data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
