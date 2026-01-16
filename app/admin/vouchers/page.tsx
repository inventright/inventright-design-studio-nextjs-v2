"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Plus, Edit, Trash2, Ticket } from "lucide-react";
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

interface Voucher {
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "",
    usesPerUser: "",
    validFrom: "",
    validUntil: "",
    departmentId: "0",
    isActive: true,
    doesNotExpire: false,
  });
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchVouchers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await fetch("/api/vouchers");
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      } else {
        toast.error("Failed to fetch vouchers");
      }
    } catch (error) {
      toast.error("Error fetching vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        usesPerUser: formData.usesPerUser ? parseInt(formData.usesPerUser) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.doesNotExpire ? null : formData.validUntil || null,
        departmentId: formData.departmentId && formData.departmentId !== "0" ? parseInt(formData.departmentId) : null,
        isActive: formData.isActive,
      };

      const url = editingVoucher
        ? `/api/vouchers/${editingVoucher.id}`
        : "/api/vouchers";
      const method = editingVoucher ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingVoucher
            ? "Voucher updated successfully"
            : "Voucher created successfully"
        );
        setDialogOpen(false);
        resetForm();
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save voucher");
      }
    } catch (error) {
      toast.error("Error saving voucher");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Voucher deleted successfully");
        fetchVouchers();
      } else {
        toast.error("Failed to delete voucher");
      }
    } catch (error) {
      toast.error("Error deleting voucher");
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxUses: voucher.maxUses?.toString() || "",
      usesPerUser: (voucher as any).usesPerUser?.toString() || "",
      validFrom: voucher.validFrom
        ? new Date(voucher.validFrom).toISOString().split("T")[0]
        : "",
      validUntil: voucher.validUntil
        ? new Date(voucher.validUntil).toISOString().split("T")[0]
        : "",
      departmentId: (voucher as any).departmentId?.toString() || "0",
      isActive: voucher.isActive,
      doesNotExpire: !voucher.validUntil,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      maxUses: "",
      usesPerUser: "",
      validFrom: "",
      validUntil: "",
      departmentId: "0",
      isActive: true,
      doesNotExpire: false,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="pt-20">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading vouchers...</p>
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
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight">Vouchers</h1>
          <p className="text-muted-foreground mt-3 text-base">
            Create and manage discount vouchers with usage tracking
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voucher Codes</CardTitle>
          <CardDescription>
            Manage discount codes with usage limits and expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No vouchers yet
              </h3>
              <p className="text-gray-600 max-w-md mb-4">
                Get started by creating your first discount voucher.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Voucher
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono font-medium">
                      {voucher.code}
                    </TableCell>
                    <TableCell>
                      {voucher.discountType === "percentage"
                        ? `${voucher.discountValue}%`
                        : `$${voucher.discountValue}`}
                    </TableCell>
                    <TableCell>
                      {voucher.usedCount} /{" "}
                      {voucher.maxUses || "Unlimited"}
                    </TableCell>
                    <TableCell>{formatDate(voucher.validFrom)}</TableCell>
                    <TableCell>
                      {voucher.validUntil ? formatDate(voucher.validUntil) : "Never"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          voucher.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {voucher.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(voucher)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(voucher.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? "Edit Voucher" : "Create New Voucher"}
            </DialogTitle>
            <DialogDescription>
              {editingVoucher
                ? "Update the voucher details below."
                : "Fill in the details to create a new discount voucher."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: e.target.value })
                    }
                    placeholder={formData.discountType === "percentage" ? "20" : "10.00"}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department (Optional)</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Restrict voucher to a specific department/service
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Total Number of Uses (Optional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-sm text-gray-500">
                    Total uses across all users
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usesPerUser">Uses Per User (Optional)</Label>
                  <Input
                    id="usesPerUser"
                    type="number"
                    value={formData.usesPerUser}
                    onChange={(e) =>
                      setFormData({ ...formData, usesPerUser: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-sm text-gray-500">
                    Limit per individual user
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From (Optional)</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    disabled={formData.doesNotExpire}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="doesNotExpire"
                  checked={formData.doesNotExpire}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, doesNotExpire: checked, validUntil: "" })
                  }
                />
                <Label htmlFor="doesNotExpire">Does Not Expire</Label>
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
            <DialogFooter className="flex-shrink-0 mt-4">
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
                {editingVoucher ? "Update" : "Create"} Voucher
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
