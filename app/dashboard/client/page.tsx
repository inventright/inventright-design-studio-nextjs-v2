'use client';

import { useState, useEffect } from 'react';
import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Package } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DesignPackage {
  id: number;
  orderId: string;
  purchaseDate: string;
  virtualPrototypeStatus: string;
  virtualPrototypeJobId: number | null;
  sellSheetStatus: string;
  sellSheetJobId: number | null;
  packageStatus: string;
}

interface Job {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  packageType: string | null;
}

export default function ClientDashboard() {
  const { user } = useWordPressAuth();
  const router = useRouter();
  const [designPackages, setDesignPackages] = useState<DesignPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.role === 'admin') {
      setIsAdmin(true);
    }
  }, [user]);

  // Fetch all clients for admin dropdown
  useEffect(() => {
    const fetchClients = async () => {
      if (!isAdmin) return;

      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const clients = data.users.filter((u: any) => u.role === 'client');
            setAllClients(clients);
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [isAdmin]);

  // Fetch design packages for the user
  useEffect(() => {
    const fetchDesignPackages = async () => {
      const targetUserId = isAdmin && selectedClientId ? selectedClientId : user?.id;
      if (!targetUserId) {
        setLoadingPackages(false);
        return;
      }

      try {
        const response = await fetch(`/api/design-packages?clientId=${targetUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDesignPackages(data.packages);
          }
        }
      } catch (error) {
        console.error('Error fetching design packages:', error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchDesignPackages();
  }, [user, isAdmin, selectedClientId]);

  // Fetch jobs for the user
  useEffect(() => {
    const fetchJobs = async () => {
      const targetUserId = isAdmin && selectedClientId ? selectedClientId : user?.id;
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
  }, [user, isAdmin, selectedClientId]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      not_started: { text: 'Not Started', className: 'bg-gray-100 text-gray-800' },
      in_progress: { text: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Completed', className: 'bg-green-100 text-green-800' },
      locked: { text: 'Locked', className: 'bg-yellow-100 text-yellow-800' },
    };
    return badges[status] || badges.not_started;
  };

  const handleStartVirtualPrototype = (orderId: string) => {
    router.push(`/job-intake?jobType=virtual_prototype&packageId=${orderId}`);
  };

  const handleStartSellSheet = (orderId: string) => {
    router.push(`/job-intake?jobType=sell_sheet&packageId=${orderId}`);
  };

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.name || user?.email || "Client"}</h1>
            <p className="text-gray-600 mt-2">Manage your design projects and requests</p>
            
            {/* Debug Info - Remove after testing */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>User: {JSON.stringify(user)}</p>
              <p>Is Admin: {String(isAdmin)}</p>
              <p>All Clients Count: {allClients.length}</p>
              <p>Selected Client ID: {selectedClientId || 'none'}</p>
            </div>
            
            {/* Admin Client Selector */}
            {isAdmin && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">View Client:</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Clients</SelectItem>
                    {allClients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Link href="/job-intake">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>

        {/* Design Package Cards */}
        {!loadingPackages && designPackages.length > 0 && (
          <div className="mb-8 space-y-4">
            {designPackages.map((pkg) => {
              const vpBadge = getStatusBadge(pkg.virtualPrototypeStatus);
              const ssBadge = getStatusBadge(pkg.sellSheetStatus);
              const isCompleted = pkg.packageStatus === 'completed';

              return (
                <Card key={pkg.id} className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-xl">Design Studio Package</CardTitle>
                          <CardDescription>
                            Purchased {new Date(pkg.purchaseDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {isCompleted && (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Package Complete
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Virtual Prototype */}
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Virtual Prototype</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${vpBadge.className}`}>
                            {vpBadge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Professional 3D rendering of your product ($375 value)
                        </p>
                        {pkg.virtualPrototypeStatus === 'not_started' && (
                          <Button
                            onClick={() => handleStartVirtualPrototype(pkg.orderId)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            🚀 Get started with your virtual prototype
                          </Button>
                        )}
                        {pkg.virtualPrototypeStatus === 'in_progress' && pkg.virtualPrototypeJobId && (
                          <Link href={`/jobs/${pkg.virtualPrototypeJobId}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Job
                            </Button>
                          </Link>
                        )}
                        {pkg.virtualPrototypeStatus === 'completed' && (
                          <div className="text-green-600 font-medium text-sm">✓ Completed!</div>
                        )}
                      </div>

                      {/* Sell Sheet */}
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Sell Sheet</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ssBadge.className}`}>
                            {ssBadge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Professional one-page marketing document ($375 value)
                        </p>
                        {pkg.sellSheetStatus === 'locked' && (
                          <div className="text-sm text-gray-500 italic">
                            🔒 Complete Virtual Prototype first
                          </div>
                        )}
                        {pkg.sellSheetStatus === 'not_started' && pkg.virtualPrototypeStatus === 'completed' && (
                          <Button
                            onClick={() => handleStartSellSheet(pkg.orderId)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            📄 Start your sell sheet
                          </Button>
                        )}
                        {pkg.sellSheetStatus === 'in_progress' && pkg.sellSheetJobId && (
                          <Link href={`/jobs/${pkg.sellSheetJobId}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Job
                            </Button>
                          </Link>
                        )}
                        {pkg.sellSheetStatus === 'completed' && (
                          <div className="text-green-600 font-medium text-sm">✓ Completed!</div>
                        )}
                      </div>
                    </div>

                    {/* View Package Details Link */}
                    <div className="mt-4 text-center">
                      <Link href={`/design-package/${pkg.orderId}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View Package Details →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-gray-500 mt-1">Database connection required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-gray-500 mt-1">Database connection required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-gray-500 mt-1">Database connection required</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>View and manage your design requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-600">Loading projects...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Start by creating a new design request. Your submitted projects will appear here.
                </p>
                <Link href="/job-intake">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                </Link>
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
