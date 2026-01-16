'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import Link from 'next/link';
import { Trash2, Search, Filter } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  clientId: number;
  designerId?: number;
  departmentId?: number;
  packageType?: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  archived: boolean;
  clientName?: string;
  clientFirstName?: string;
  clientLastName?: string;
}

interface Department {
  id: number;
  name: string;
}

interface Designer {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
}

export default function AllJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDesigner, setSelectedDesigner] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
    fetchDesigners();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.filter((job: Job) => !job.archived && !job.isDraft));
      }
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  const fetchDesigners = async () => {
    try {
      const response = await fetch('/api/users?role=designer');
      if (response.ok) {
        const data = await response.json();
        setDesigners(data);
      }
    } catch (error) {
      console.error('Failed to load designers');
    }
  };

  const handleDelete = async (jobId: number) => {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Job deleted successfully');
          fetchJobs();
        } else {
          toast.error('Failed to delete job');
        }
      } catch (error) {
        toast.error('Error deleting job');
      }
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.clientName && job.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.clientFirstName && job.clientFirstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.clientLastName && job.clientLastName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Department filter
    const matchesDepartment = selectedDepartment === 'all' || 
      (job.departmentId && job.departmentId.toString() === selectedDepartment);

    // Designer filter
    const matchesDesigner = selectedDesigner === 'all' || 
      (selectedDesigner === 'unassigned' && !job.designerId) ||
      (job.designerId && job.designerId.toString() === selectedDesigner);

    // Status filter
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesDesigner && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New Job': 'bg-gray-900 text-white',
      'Assigned to Designer': 'bg-indigo-600 text-white',
      'Job in Progress': 'bg-purple-500 text-white',
      'Proof Sent': 'bg-green-600 text-white',
      'Revisions Requested': 'bg-yellow-500 text-white',
      'Job Complete': 'bg-orange-500 text-white',
      'Cancel Job': 'bg-red-600 text-white',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Jobs</h1>
            <p className="text-gray-600">View and manage all jobs across departments and designers</p>
          </div>

          {/* Filters */}
          <GlassCard className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search jobs or customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Designer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designer
                  </label>
                  <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Designers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Designers</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {designers.map((designer) => (
                        <SelectItem key={designer.id} value={designer.id.toString()}>
                          {designer.name || `${designer.firstName || ''} ${designer.lastName || ''}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New Job">New Job</SelectItem>
                      <SelectItem value="Assigned to Designer">Assigned to Designer</SelectItem>
                      <SelectItem value="Job in Progress">Job in Progress</SelectItem>
                      <SelectItem value="Proof Sent">Proof Sent</SelectItem>
                      <SelectItem value="Revisions Requested">Revisions Requested</SelectItem>
                      <SelectItem value="Job Complete">Job Complete</SelectItem>
                      <SelectItem value="Cancel Job">Cancel Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredJobs.length} of {jobs.length} jobs
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartment('all');
                    setSelectedDesigner('all');
                    setSelectedStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Jobs Table */}
          <GlassCard>
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No jobs found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Job</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{job.title}</div>
                            {(() => {
                              const customerName = job.clientName || 
                                (job.clientFirstName && job.clientLastName ? `${job.clientFirstName} ${job.clientLastName}` : null) ||
                                job.clientFirstName || 
                                job.clientLastName;
                              
                              if (customerName) {
                                return (
                                  <div className="text-sm text-gray-500 truncate max-w-md">
                                    {customerName}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                            {job.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Link href={`/jobs/${job.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                👁️ View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(job.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}
