'use client';

import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function DesignerDashboard() {
  const { user } = useWordPressAuth();

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Designer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name || user?.email || "Designer"}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Projects</CardTitle>
            <CardDescription>Projects assigned to you for design work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assigned projects</h3>
              <p className="text-gray-600 max-w-md">
                Database connection required to view assigned projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
