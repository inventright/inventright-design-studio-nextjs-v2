"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import LexicalEditor from "@/components/LexicalEditor";
import { Plus, Edit, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  triggerEvent: string | null;
  departmentId: number | null;
  recipientType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    triggerEvent: "",
    departmentId: "",
    recipientType: "customer",
    isActive: true,
  });
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error("Failed to fetch email templates");
      }
    } catch (error) {
      toast.error("Error fetching email templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTemplate
        ? `/api/email-templates/${editingTemplate.id}`
        : "/api/email-templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingTemplate
            ? "Template updated successfully"
            : "Template created successfully"
        );
        setDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        toast.error("Failed to save template");
      }
    } catch (error) {
      toast.error("Error saving template");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      toast.error("Error deleting template");
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      triggerEvent: template.triggerEvent || "",
      departmentId: template.departmentId ? template.departmentId.toString() : "0",
      recipientType: template.recipientType || "customer",
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      subject: "",
      body: "",
      triggerEvent: "",
      departmentId: "0",
      recipientType: "customer",
      isActive: true,
    });
    setTestEmail("");
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/email-templates/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: formData.subject,
          body: formData.body,
        }),
      });

      if (response.ok) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        const data = await response.json();
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to send test email';
        toast.error(errorMessage, { duration: 10000 });
        console.error('[Test Email] Error details:', data);
      }
    } catch (error) {
      toast.error('Error sending test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="pt-20">
          <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Loading email templates...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-20">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Email Templates
              </h1>
              <p className="text-gray-600 mt-2">
                Manage automated email templates for notifications
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Create and manage email templates for automated notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No templates yet
                  </h3>
                  <p className="text-gray-600 max-w-md mb-4">
                    Get started by creating your first email template.
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell>
                          {template.triggerEvent || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="w-[80vw] max-w-none h-[80vh] max-h-[80vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                <DialogTitle className="text-2xl">
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate
                    ? "Update the email template details below."
                    : "Fill in the details to create a new email template."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Welcome Email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="triggerEvent">
                        Trigger Event (Optional)
                      </Label>
                      <Select
                        value={formData.triggerEvent}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            triggerEvent: value,
                          })
                        }
                      >
                        <SelectTrigger id="triggerEvent">
                          <SelectValue placeholder="Select a trigger event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Manual)</SelectItem>
                          <SelectItem value="package_purchased">Package Purchased</SelectItem>
                          <SelectItem value="job_assigned">Job Assigned</SelectItem>
                          <SelectItem value="job_started">Job Started</SelectItem>
                          <SelectItem value="proof_sent">Proof Sent</SelectItem>
                          <SelectItem value="revisions_requested">Revisions Requested</SelectItem>
                          <SelectItem value="job_completed">Job Completed</SelectItem>
                          <SelectItem value="job_stale_reminder">Stale Job Reminder</SelectItem>
                          <SelectItem value="user_signup">User Signup</SelectItem>
                          <SelectItem value="payment_received">Payment Received</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">
                      Department (Optional)
                    </Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          departmentId: value,
                        })
                      }
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None (All Departments)</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientType">
                      Email Recipient
                    </Label>
                    <Select
                      value={formData.recipientType}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          recipientType: value,
                        })
                      }
                    >
                      <SelectTrigger id="recipientType">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="custom">Custom Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Specify who should receive this email. Extra contacts added to jobs will also be copied.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="e.g., Welcome to inventRight!"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <LexicalEditor
                      value={formData.body}
                      onChange={(value) =>
                        setFormData({ ...formData, body: value })
                      }
                      placeholder="Enter the email content here..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  {/* Shortcode Reference */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Available Shortcodes</h4>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{DESIGN_PACKAGE_LINK}}'}</code>
                          <p className="text-blue-700 mt-1">Link to customer's Design Package page</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{CUSTOMER_NAME}}'}</code>
                          <p className="text-blue-700 mt-1">Customer's full name</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{CUSTOMER_EMAIL}}'}</code>
                          <p className="text-blue-700 mt-1">Customer's email address</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{ORDER_ID}}'}</code>
                          <p className="text-blue-700 mt-1">Order/Payment ID</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{JOB_ID}}'}</code>
                          <p className="text-blue-700 mt-1">Job ID number</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{CURRENT_DATE}}'}</code>
                          <p className="text-blue-700 mt-1">Current date (formatted)</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{APP_URL}}'}</code>
                          <p className="text-blue-700 mt-1">Base application URL</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{JOB_NAME}}'}</code>
                          <p className="text-blue-700 mt-1">Job name/title</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{DESIGNER_NAME}}'}</code>
                          <p className="text-blue-700 mt-1">Assigned designer's name</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{STATUS}}'}</code>
                          <p className="text-blue-700 mt-1">Current status</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{DESIGNER_EMAIL}}'}</code>
                          <p className="text-blue-700 mt-1">Assigned designer's email</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{ADMIN_EMAIL}}'}</code>
                          <p className="text-blue-700 mt-1">Admin email address</p>
                        </div>
                        <div>
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{'{{MANAGER_EMAIL}}'}</code>
                          <p className="text-blue-700 mt-1">Manager email address</p>
                        </div>
                      </div>
                      <p className="text-blue-600 italic mt-3">Example: Use &lt;a href="{'{{DESIGN_PACKAGE_LINK}}'}"&gt;View Package&lt;/a&gt; to create a clickable link</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
                  <div className="flex items-center gap-2 mr-auto">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-64"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendTest}
                      disabled={sendingTest || !testEmail}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {sendingTest ? 'Sending...' : 'Send Test'}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? "Update" : "Create"} Template
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
