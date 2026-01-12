import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWordPressAuth } from "../hooks/useWordPressAuth";
import { Menu, X } from "lucide-react";
import { getRoleDisplayName } from "../utils/roleMapping";
import { toast } from "sonner";

export default function Header() {
  const { user, loading, logout } = useWordPressAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md" style={{ width: '100vw' }}>
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="/ds-logo.png" 
                alt="inventRight Design Studio" 
                className="h-10 w-auto"
              />
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!loading && user && (
              <>
                {/* Logged-in Navigation */}
                <a href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer flex items-center gap-2">
                  <span>🏠</span> Dashboard
                </a>
                <a href="/job-intake" className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer flex items-center gap-2">
                  <span>📋</span> New Request
                </a>
                
                {/* User Profile & Logout */}
                <div className="flex items-center gap-3 border-l pl-6 ml-2">
                  <div className="relative group">
                    <div className="flex flex-col items-end cursor-pointer">
                      <span className="text-gray-700 font-medium">
                        {user?.name || user?.email || 'User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user?.role ? getRoleDisplayName(user.role) : 'Client'}
                      </span>
                    </div>
                    
                    {/* Admin Dashboard Switcher Dropdown */}
                    {user?.role === 'admin' && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <a href="/dashboard/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            👨‍💼 Admin Dashboard
                          </a>
                          <a href="/dashboard/manager" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            📊 Manager Dashboard
                          </a>
                          <a href="/dashboard/designer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            🎨 Designer Dashboard
                          </a>
                          <a href="/dashboard/client" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            👤 Client Dashboard
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </>
            )}

            {/* Login Button - Only show when logged out */}
            {!loading && !user && (
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <nav className="flex flex-col gap-4">
              {!loading && user && (
                <>
                  <div className="px-4 py-2 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="font-medium text-gray-900">
                      {user?.name || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {user?.role ? getRoleDisplayName(user.role) : 'Client'}
                    </p>
                  </div>
                  
                  <a 
                    href="/dashboard" 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>🏠</span> Dashboard
                  </a>
                  
                  {/* Admin Dashboard Switcher - Mobile */}
                  {user?.role === 'admin' && (
                    <div className="px-4 py-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-600 font-semibold mb-2">SWITCH DASHBOARD</p>
                      <div className="flex flex-col gap-2">
                        <a 
                          href="/dashboard/admin" 
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded transition-colors flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>👨‍💼</span> Admin Dashboard
                        </a>
                        <a 
                          href="/dashboard/manager" 
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded transition-colors flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>📊</span> Manager Dashboard
                        </a>
                        <a 
                          href="/dashboard/designer" 
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded transition-colors flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>🎨</span> Designer Dashboard
                        </a>
                        <a 
                          href="/dashboard/client" 
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded transition-colors flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>👤</span> Client Dashboard
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <a 
                    href="/job-intake" 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📋</span> New Request
                  </a>
                  
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2 text-left"
                  >
                    <span>🚪</span> Logout
                  </button>
                </>
              )}

              {!loading && !user && (
                <Link href="/login">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
