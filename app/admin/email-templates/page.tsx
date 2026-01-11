"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

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
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading email templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Email Templates</h1>
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
                      {template.triggerEvent || <span className="text-gray-400">—</span>}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the email template details below."
                : "Fill in the details to create a new email template."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
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
                <Label htmlFor="triggerEvent">Trigger Event (Optional)</Label>
                <Input
                  id="triggerEvent"
                  value={formData.triggerEvent}
                  onChange={(e) =>
                    setFormData({ ...formData, triggerEvent: e.target.value })
                  }
                  placeholder="e.g., user_signup, job_completed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  placeholder="Enter the email content here..."
                  rows={10}
                  required
                />
                <p className="text-sm text-gray-500">
                  You can use variables like {"{name}"}, {"{email}"}, etc.
                </p>
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
            </div>
            <DialogFooter>
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
  );
}
