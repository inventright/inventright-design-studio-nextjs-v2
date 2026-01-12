'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { getRoleDisplayName } from '@/utils/roleMapping';
import type { DesignStudioRole } from '@/utils/roleMapping';

interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  role: DesignStudioRole;
  wordpressRoles?: string[];
  lastLogin?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Load mock users (in a real app, this would fetch from WordPress API)
  useEffect(() => {
    // Mock data for demonstration
    const mockUsers: User[] = [
      {
        id: 1,
        email: 'james@inventright.com',
        name: 'James Shehan',
        username: 'typvsns',
        role: 'admin',
        wordpressRoles: ['administrator'],
        lastLogin: '2026-01-10'
      },
      {
        id: 2,
        email: 'designer@inventright.com',
        name: 'Sarah Designer',
        username: 'sdesigner',
        role: 'designer',
        wordpressRoles: ['author'],
        lastLogin: '2026-01-09'
      },
      {
        id: 3,
        email: 'client@example.com',
        name: 'John Client',
        username: 'jclient',
        role: 'client',
        wordpressRoles: ['subscriber'],
        lastLogin: '2026-01-08'
      }
    ];
    
    setUsers(mockUsers);
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleResetPassword = async (user: User) => {
    // In a real app, this would call WordPress API to send password reset email
    toast.success(`Password reset email sent to ${user.email}`);
  };

  const handleLogoutUser = async (user: User) => {
    // In a real app, this would invalidate the user's session
    toast.success(`${user.name} has been logged out`);
  };

  const handleImpersonate = async (user: User) => {
    // In a real app, this would create an impersonation session
    toast.info(`Impersonating ${user.name}...`);
    // Store original admin user data
    const currentUser = localStorage.getItem('user_data');
    if (currentUser) {
      localStorage.setItem('impersonation_original_user', currentUser);
    }
    // Set impersonated user data
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('impersonating', 'true');
    // Redirect to their dashboard
    window.location.href = '/dashboard';
  };

  const handleRoleChange = async (user: User, newRole: DesignStudioRole) => {
    // In a real app, this would update the user's role in WordPress
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
      window.location.href = '/dashboard/admin';
    }
  };

  // Check if currently impersonating
  const isImpersonating = localStorage.getItem('impersonating') === 'true';

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

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage users, reset passwords, and impersonate accounts</p>
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
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
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">@{user.username}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
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
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {user.lastLogin || 'Never'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleResetPassword(user)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🔑 Reset Password
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching your search criteria</p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About User Management</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Change Role:</strong> Click the role dropdown to change a user's access level (Admin, Manager, Designer, or Client)</p>
            <p><strong>Reset Password:</strong> Sends a password reset email to the user's registered email address</p>
            <p><strong>Logout:</strong> Immediately logs the user out and invalidates their current session</p>
            <p><strong>Impersonate:</strong> Allows you to view the site as that user would see it (useful for debugging)</p>
            <p className="text-yellow-700 bg-yellow-50 p-3 rounded-md mt-4">
              ⚠️ <strong>Note:</strong> Currently showing mock data. Connect to WordPress API to manage real users.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
