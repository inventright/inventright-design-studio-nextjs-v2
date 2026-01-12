'use client';

import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface JobDetailProps {
  params: { id: string };
}

export default function JobDetail({ params }: JobDetailProps) {
  const { user } = useWordPressAuth();
  const jobId = params.id;

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
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Job ID: {jobId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job details unavailable</h3>
              <p className="text-gray-600 max-w-md mb-6">
                Database connection required to view job details.
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
