"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface ExtraContact {
  id: number;
  jobId: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
}

interface JobExtraContactsProps {
  jobId: number;
  userRole: string;
}

export default function JobExtraContacts({ jobId, userRole }: JobExtraContactsProps) {
  const [extraContacts, setExtraContacts] = useState<ExtraContact[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Only show to managers, designers, and admins
  const canManageContacts = ["manager", "designer", "admin"].includes(userRole);

  useEffect(() => {
    if (canManageContacts) {
      fetchExtraContacts();
      fetchAvailableUsers();
    }
  }, [jobId, canManageContacts]);

  const fetchExtraContacts = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/extra-contacts`);
      if (response.ok) {
        const data = await response.json();
        setExtraContacts(data);
      }
    } catch (error) {
      console.error("Error fetching extra contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Fetch all managers, designers, and admins
      const response = await fetch("/api/users?roles=manager,designer,admin");
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const handleAddContact = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to add");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/extra-contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(selectedUserId) }),
      });

      if (response.ok) {
        const newContact = await response.json();
        setExtraContacts([...extraContacts, newContact]);
        setSelectedUserId("");
        toast.success("Contact added successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Error adding contact");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/extra-contacts?contactId=${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExtraContacts(extraContacts.filter((c) => c.id !== contactId));
        toast.success("Contact removed successfully");
      } else {
        toast.error("Failed to remove contact");
      }
    } catch (error) {
      console.error("Error removing contact:", error);
      toast.error("Error removing contact");
    }
  };

  // Don't show the component to clients
  if (!canManageContacts) {
    return null;
  }

  if (loading) {
    return null;
  }

  // Filter out users who are already added as extra contacts
  const filteredUsers = availableUsers.filter(
    (user) => !extraContacts.some((contact) => contact.userId === user.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Extra Contacts
        </CardTitle>
        <CardDescription>
          Add managers, designers, or admins who should be copied on email notifications for this job
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add contact dropdown */}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a user to add" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No more users available to add</div>
              ) : (
                filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email} ({user.role})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddContact}
            disabled={!selectedUserId || adding}
            size="sm"
          >
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>

        {/* List of added contacts */}
        {extraContacts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Added Contacts:</div>
            {extraContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-medium">{contact.userName || "Unknown"}</div>
                  <div className="text-sm text-gray-500">
                    {contact.userEmail} • {contact.userRole}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContact(contact.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {extraContacts.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No extra contacts added yet. Add users above to copy them on email notifications.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
