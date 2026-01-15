"use client";

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, RefreshCw, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string;
  errorMessage?: string;
  resentFrom?: number;
  metadata?: any;
}

export default function EmailMonitoringPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/emails?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.logs);
      } else {
        toast.error('Failed to fetch email logs');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to fetch email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [statusFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email log?')) return;

    try {
      setActionLoading(id);
      const response = await fetch(`/api/admin/emails/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Email log deleted successfully');
        fetchEmails();
      } else {
        toast.error('Failed to delete email log');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error('Failed to delete email log');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (id: number) => {
    if (!confirm('Are you sure you want to resend this email?')) return;

    try {
      setActionLoading(id);
      const response = await fetch(`/api/admin/emails/${id}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Email resent successfully');
        fetchEmails();
      } else {
        toast.error('Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <div className="container mx-auto py-8 px-4 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all emails sent from the system
          </p>
        </div>
        <Button onClick={fetchEmails} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by recipient or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Email Logs Table */}
      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading email logs...</p>
            </div>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No email logs found</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">{email.recipient}</TableCell>
                  <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                  <TableCell>
                    <Badge
                      variant={email.status === 'sent' ? 'default' : 'destructive'}
                    >
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(email.sentAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-destructive">
                    {email.errorMessage || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(email.id)}
                        disabled={actionLoading === email.id}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(email.id)}
                        disabled={actionLoading === email.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      {!loading && emails.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {emails.length} email log{emails.length !== 1 ? 's' : ''}
        </div>
      )}
      </div>
    </div>
  );
}
