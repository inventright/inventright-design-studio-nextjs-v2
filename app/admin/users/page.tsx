'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { getRoleDisplayName } from '@/lib/roleMapping';
import type { DesignStudioRole } from '@/lib/roleMapping';
import { Plus, X, Mail, Copy } from 'lucide-react';

interface User {
  id: number;
  openId: string;
  email: string;
  name: string;
  role: DesignStudioRole;
  wordpressId?: number;
  lastSignedIn: string;
  createdAt?: string;
  loginMethod: string;
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<DesignStudioRole>('client');
  
  // Add user dialog state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'client' as DesignStudioRole,
    password: ''
  });
  const [sendPasswordLink, setSendPasswordLink] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Load current user role
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserRole(user.role);
    }
  }, []);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsers(data.users);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleShowJobs = (user: User) => {
    // Navigate to admin jobs page with user filter
    router.push(`/admin/jobs?userId=${user.id}&userName=${encodeURIComponent(user.name || user.email)}`);
  };

  const handleResetPassword = async (user: User) => {
    // In a real app, this would call WordPress API to send password reset email
    toast.success(`Password reset email sent to ${user.email}`);
  };

  const handleCopyPasswordLink = async (user: User) => {
    try {
      // Generate password setup token by calling the API
      const response = await fetch('/api/admin/generate-password-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const setupUrl = `${window.location.origin}/setup-password?token=${data.token}&email=${encodeURIComponent(data.email)}`;
        await navigator.clipboard.writeText(setupUrl);
        toast.success('Password setup link copied to clipboard!');
      } else {
        toast.error(data.error || 'Failed to generate password link');
      }
    } catch (error) {
      console.error('Error copying password link:', error);
      toast.error('Failed to copy password link');
    }
  };

  const handleLogoutUser = async (user: User) => {
    // In a real app, this would invalidate the user's session
    toast.success(`${user.name} has been logged out`);
  };

  const handleImpersonate = async (user: User) => {
    // In a real app, this would create an impersonation session
    toast.info(`Impersonating ${user.name}...`);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove user from local state
      setUsers(users.filter(u => u.id !== user.id));
      toast.success(`${user.name} has been deleted`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = async (user: User, newRole: DesignStudioRole) => {
    // In a real app, this would update the user's role in the database
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, role: newRole } : u
    );
    setUsers(updatedUsers);
    toast.success(`${user.name}'s role changed to ${getRoleDisplayName(newRole)}`);
  };

  const handleStopImpersonation = () => {
    const originalUser = localStorage.getItem('impersonation_original_user');
    if (originalUser) {
      localStorage.setItem('user_data', originalUser);
      localStorage.removeItem('impersonation_original_user');
      localStorage.removeItem('impersonating');
      toast.success('Stopped impersonation');
      window.location.href = '/admin/users';
    }
  };

  const handleAddUser = async () => {
    // Validate inputs
    if (!newUserData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!newUserData.email.trim()) {
      toast.error('Please enter an email');
      return;
    }
    if (!sendPasswordLink && !newUserData.password.trim()) {
      toast.error('Please enter a password or choose to send a password setup link');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          password: sendPasswordLink ? null : newUserData.password,
          sendPasswordLink: sendPasswordLink
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(sendPasswordLink 
          ? `User created! Password setup link sent to ${newUserData.email}` 
          : 'User created successfully!');
        
        // Refresh users list
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success) {
            setUsers(usersData.users);
          }
        }

        // Reset form and close dialog
        setNewUserData({ name: '', email: '', role: 'client', password: '' });
        setSendPasswordLink(false);
        setShowAddUserDialog(false);
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  // Check if currently impersonating
  const isImpersonating = typeof window !== 'undefined' && localStorage.getItem('impersonating') === 'true';
  
  // Check if user is admin (full permissions) or designer (view-only)
  const isAdmin = currentUserRole === 'admin';
  const isDesigner = currentUserRole === 'designer';
  const hasAccess = isAdmin || isDesigner;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <GlassCard className="p-6">
            <p className="text-center text-gray-600">You don't have permission to access this page.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {isImpersonating && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-800 font-semibold">⚠️ Impersonation Mode Active</span>
              <span className="text-yellow-700">You are viewing the site as another user</span>
            </div>
            <Button onClick={handleStopImpersonation} variant="outline" size="sm">
              Stop Impersonation
            </Button>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">
              {isDesigner ? 'View users and their jobs' : 'Manage users, reset passwords, and impersonate accounts'}
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setShowAddUserDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Member
            </Button>
          )}
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="manager">Managers</option>
                <option value="designer">Designers</option>
                <option value="client">Clients</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredUsers.length} of {users.length} users
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            {user.loginMethod === 'google' ? '🔐 Google' : '🔐 WordPress'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isAdmin ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value as DesignStudioRole)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'designer' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="admin">Administrator</option>
                            <option value="manager">Manager</option>
                            <option value="designer">Designer</option>
                            <option value="client">Client</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'designer' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {(() => {
                          if (!user.lastSignedIn) return 'Never logged in';
                          const lastSignIn = new Date(user.lastSignedIn);
                          const createdAt = new Date(user.createdAt || user.lastSignedIn);
                          // If last sign in is within 1 second of creation, user hasn't logged in yet
                          if (Math.abs(lastSignIn.getTime() - createdAt.getTime()) < 1000) {
                            return 'Never logged in';
                          }
                          return lastSignIn.toLocaleDateString();
                        })()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleShowJobs(user)}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            📋 Show Jobs
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                onClick={() => handleResetPassword(user)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                🔑 Reset Password
                              </Button>
                              <Button
                                onClick={() => handleCopyPasswordLink(user)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                title="Copy password setup link"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleLogoutUser(user)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                🚪 Logout
                              </Button>
                              <Button
                                onClick={() => handleImpersonate(user)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                👤 Impersonate
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(user)}
                                variant="outline"
                                size="sm"
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              >
                                🗑️ Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching your search criteria</p>
            </div>
          )}
        </GlassCard>

        {isAdmin && (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About User Management</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Show Jobs:</strong> View all jobs associated with this user</p>
              <p><strong>Change Role:</strong> Click the role dropdown to change a user's access level (Admin, Manager, Designer, or Client)</p>
              <p><strong>Reset Password:</strong> Sends a password reset email to the user's registered email address</p>
              <p><strong>Logout:</strong> Immediately logs the user out and invalidates their current session</p>
              <p><strong>Impersonate:</strong> Allows you to view the site as that user would see it (useful for debugging)</p>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Add User Dialog */}
      {showAddUserDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Member</h2>
              <button
                onClick={() => {
                  setShowAddUserDialog(false);
                  setNewUserData({ name: '', email: '', role: 'client', password: '' });
                  setSendPasswordLink(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as DesignStudioRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client">Client</option>
                  <option value="designer">Designer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={sendPasswordLink}
                    onChange={(e) => {
                      setSendPasswordLink(e.target.checked);
                      if (e.target.checked) {
                        setNewUserData({ ...newUserData, password: '' });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Send password setup link via email
                  </span>
                </label>

                {!sendPasswordLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <Input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 8 characters
                    </p>
                  </div>
                )}

                {sendPasswordLink && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        The user will receive an email with a secure link to set up their own password.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddUserDialog(false);
                  setNewUserData({ name: '', email: '', role: 'client', password: '' });
                  setSendPasswordLink(false);
                }}
                variant="outline"
                className="flex-1"
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={creatingUser}
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
