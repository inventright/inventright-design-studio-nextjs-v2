"use client";

import { useState, useEffect, use } from 'react';
import { useWordPressAuth } from "@/hooks/useWordPressAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Loader2, Upload, Send, Download, Paperclip, User, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import JobTimeline from "@/components/jobs/JobTimeline";
import StatusAutomationInfo from "@/components/jobs/StatusAutomationInfo";

interface JobDetailProps {
  params: Promise<{ id: string }>;
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
  designerName?: string | null;
  designerEmail?: string | null;
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
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
}

interface Message {
  id: number;
  jobId: number;
  userId: number | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
}

export default function JobDetail({ params }: JobDetailProps) {
  console.log('🚀 [Job Details] Component mounted!');
  console.log('🚀 [Job Details] Params (Promise):', params);
  
  // Unwrap the params Promise using React's use() hook (Next.js 15)
  const unwrappedParams = use(params);
  console.log('🚀 [Job Details] Unwrapped params:', unwrappedParams);
  console.log('🚀 [Job Details] Job ID:', unwrappedParams.id);
  
  const { user } = useWordPressAuth();
  const jobId = unwrappedParams.id;
  const [job, setJob] = useState<Job | null>(null);
  const [files, setFiles] = useState<JobFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [designers, setDesigners] = useState<Array<{id: number; name: string; email: string}>>([]);
  const [changingDesigner, setChangingDesigner] = useState(false);

  useEffect(() => {
    console.log('⚡ [Job Details] useEffect triggered!');
    console.log('⚡ [Job Details] jobId in useEffect:', jobId);
    
    const fetchJobData = async () => {
      console.log('❓ [Job Details] Checking if should fetch. jobId:', jobId);
      if (!jobId) {
        console.log('❌ [Job Details] No jobId, skipping fetch');
        return;
      }

      console.log('📡 [Job Details] Starting fetch for job:', jobId);
      setLoading(true);
      
      try {
        console.log('🔑 [Job Details] Checking auth credentials...');
        
        // Fetch job details
        console.log('🌐 [Job Details] Fetching job from /api/jobs/' + jobId);
        const jobResponse = await fetch(`/api/jobs/${jobId}`);
        console.log('📊 [Job Details] Job response status:', jobResponse.status);
        
        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job');
        }
        
        const jobData = await jobResponse.json();
        console.log('✅ [Job Details] Job data loaded:', jobData);
        setJob(jobData);

        // Fetch files
        console.log('📁 [Job Details] Fetching files...');
        const filesResponse = await fetch(`/api/jobs/${jobId}/files`);
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          console.log('✅ [Job Details] Files loaded:', filesData.length);
          setFiles(filesData);
        } else {
          console.log('⚠️ [Job Details] Files fetch failed, continuing without files');
        }

        // Fetch messages
        console.log('💬 [Job Details] Fetching messages...');
        const messagesResponse = await fetch(`/api/messages?jobId=${jobId}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log('✅ [Job Details] Messages loaded:', messagesData.length);
          setMessages(messagesData);
        } else {
          console.log('⚠️ [Job Details] Messages fetch failed, continuing without messages');
        }

        // Fetch designers for admin reassignment
        console.log('👥 [Job Details] Fetching designers...');
        const designersResponse = await fetch('/api/users');
        if (designersResponse.ok) {
          const designersData = await designersResponse.json();
          const designerUsers = designersData.users?.filter((u: any) => u.role === 'designer') || [];
          console.log('✅ [Job Details] Designers loaded:', designerUsers.length);
          setDesigners(designerUsers);
        } else {
          console.log('⚠️ [Job Details] Designers fetch failed');
        }

        console.log('🎯 [Job Details] Setting loading to false');
        setLoading(false);
      } catch (error: any) {
        console.error('🚨 [Job Details] Error fetching job data:', error);
        console.error('🚨 [Job Details] Error stack:', error.stack);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', jobId);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      toast.success('File uploaded successfully');
      
      // Refresh files list
      const filesResponse = await fetch(`/api/jobs/${jobId}/files`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
    setUploading(false);
    
    // Reset file input
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: parseInt(jobId),
          content: newMessage,
          isInternal: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent');
      setNewMessage('');
      
      // Refresh messages list
      const messagesResponse = await fetch(`/api/messages?jobId=${jobId}`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
    setSendingMessage(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedJob = await response.json();
      setJob(updatedJob);
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDesignerChange = async (newDesignerId: string) => {
    setChangingDesigner(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designerId: newDesignerId === 'unassigned' ? null : parseInt(newDesignerId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update designer');
      }

      toast.success('Designer updated successfully');
      // Refresh job data to get updated designer info
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
      }
    } catch (error) {
      console.error('Error updating designer:', error);
      toast.error('Failed to update designer');
    }
    setChangingDesigner(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-8 max-w-7xl mx-auto pt-24">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job not found</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  {error || 'The job you are looking for does not exist.'}
                </p>
                <Link href="/dashboard/client">
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

  const statusColors: Record<string, string> = {
    'New Job': 'bg-blue-100 text-blue-800',
    'Assigned to Designer': 'bg-indigo-100 text-indigo-800',
    'Job in Progress': 'bg-purple-100 text-purple-800',
    'Proof Sent': 'bg-green-100 text-green-800',
    'Revisions Requested': 'bg-yellow-100 text-yellow-800',
    'Job Complete': 'bg-emerald-100 text-emerald-800',
    // Legacy statuses for backward compatibility
    'Draft': 'bg-gray-100 text-gray-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Review': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-800',
  };

  const availableStatuses = ['New Job', 'Assigned to Designer', 'Job in Progress', 'Proof Sent', 'Revisions Requested', 'Job Complete'];

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto pt-24">
        <div className="mb-6">
          <Link href="/dashboard/client">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription>Job ID: {job.id}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                      {job.status}
                    </span>
                    {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'designer') && (
                      <Link href={`/job-intake?draftId=${job.id}`}>
                        <Button variant="outline" size="sm">
                          Edit Job
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <p className="text-gray-900 font-medium">{job.priority}</p>
                  </div>
                  {job.packageType && (
                    <div>
                      <span className="text-gray-600">Package Type:</span>
                      <p className="text-gray-900 font-medium">{job.packageType}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <p className="text-gray-900 font-medium">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <p className="text-gray-900 font-medium">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {job.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-gray-900 font-semibold mb-3">Job Details</h3>
                    {(() => {
                      try {
                        const formData = JSON.parse(job.description);
                        const fieldLabels: Record<string, string> = {
                          // Basic fields
                          howHeard: 'How did you hear about us?',
                          memberStatus: 'Member Status',
                          coachName: 'Coach Name',
                          category: 'Category',
                          productDescription: 'Product Description',
                          
                          // Sell Sheet fields
                          sellSheetLayout: 'Sell Sheet Layout',
                          photoDescription: 'Photo Description',
                          problemPhotoFile: 'Problem Photo File',
                          solutionPhotoFile: 'Solution Photo File',
                          problemSolutionDescription: 'Problem/Solution Description',
                          storyboard1File: 'Storyboard 1 File',
                          storyboard2File: 'Storyboard 2 File',
                          storyboard3File: 'Storyboard 3 File',
                          storyboardDescription: 'Storyboard Description',
                          benefitStatement: 'Benefit Statement',
                          bulletPoints: 'Bullet Points',
                          videoLink: 'Video Link',
                          legalInfo: 'Legal Information',
                          additionalInfo: 'Additional Information',
                          
                          // Line Drawing fields
                          virtualPrototype: 'Virtual Prototype',
                          drawingType: 'Drawing Type',
                          numberOfDrawings: 'Number of Drawings',
                          drawingDetails: 'Drawing Details',
                          
                          // Virtual Prototype fields
                          prototypePurpose: 'Prototype Purpose',
                          targetAudience: 'Target Audience',
                          keyFeatures: 'Key Features',
                          dimensions: 'Dimensions',
                          materials: 'Materials',
                          colorPreferences: 'Color Preferences',
                          functionalRequirements: 'Functional Requirements',
                          budget: 'Budget',
                          timeline: 'Timeline',
                          referenceImages: 'Reference Images',
                          additionalNotes: 'Additional Notes',
                        };
                        
                        return (
                          <div className="space-y-3">
                            {Object.entries(formData).map(([key, value]) => {
                              // Skip empty values
                              if (!value || (Array.isArray(value) && value.length === 0)) return null;
                              
                              const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              
                              return (
                                <div key={key} className="border-b border-gray-100 pb-2">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">{label}:</p>
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } catch (e) {
                        // If description is not JSON, display as plain text
                        return (
                          <p className="text-gray-700 whitespace-pre-wrap break-words">{job.description}</p>
                        );
                      }
                    })()}
                  </div>
                )}              </CardContent>
            </Card>

            {/* Assigned Designer Card */}
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Assigned Designer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.role === 'admin' ? (
                  <div className="space-y-3">
                    <Select 
                      value={job.designerId?.toString() || 'unassigned'} 
                      onValueChange={handleDesignerChange}
                      disabled={changingDesigner}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a designer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {designers.map((designer) => (
                          <SelectItem key={designer.id} value={designer.id.toString()}>
                            {designer.name} ({designer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {changingDesigner && (
                      <p className="text-xs text-gray-500">Updating designer...</p>
                    )}
                  </div>
                ) : job.designerId && job.designerName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {job.designerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{job.designerName}</p>
                      {job.designerEmail && (
                        <p className="text-sm text-gray-600">{job.designerEmail}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No designer assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline Tabs */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="space-y-4">
                    {/* Messages List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No messages yet</p>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
                                    {message.userName || message.userEmail || 'Unknown User'}
                                  </span>
                                  {message.userRole && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                      {message.userRole}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(message.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Message Input */}
                    <div className="space-y-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[100px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          {sendingMessage ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline">
                    <JobTimeline job={job} messages={messages} files={files} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Change Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={job.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem 
                        key={status} 
                        value={status}
                        className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} font-medium my-1 rounded-md`}
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Status Automation Info */}
            <StatusAutomationInfo />

            {/* Files */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files</CardTitle>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                      <Upload className="w-4 h-4" />
                      Upload
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                {uploading && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}

                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 break-words">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.uploaderName} • {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/files/${file.id}/download`);
                              if (!response.ok) throw new Error('Failed to get download URL');
                              const data = await response.json();
                              window.open(data.url, '_blank');
                            } catch (error) {
                              console.error('Download error:', error);
                              toast.error('Failed to download file');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No files uploaded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
