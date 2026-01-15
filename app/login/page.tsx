'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { isAuthenticated } from '@/lib/wordpressAuth';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies';
import { mapWordPressRole, type DesignStudioRole } from '@/lib/roleMapping';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://inventtraining.com/wp-json';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '694179851188-snel037oka5nn47302tblrs06s9n4qep.apps.googleusercontent.com';

// Helper function to get redirect URL based on user role
const getRedirectUrl = (role: string) => {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'manager':
      return '/dashboard/manager';
    case 'designer':
      return '/dashboard/designer';
    case 'client':
    default:
      return '/job-intake';
  }
};

export default function WordPressLogin() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated()) {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          window.location.href = getRedirectUrl(user.role || 'client');
        } else {
          window.location.href = '/job-intake';
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = '/job-intake';
      }
    }
  }, []);

  const handleWordPressLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if username looks like an email
      const isEmail = credentials.username.includes('@');
      
      // If it's an email, try email/password login first
      if (isEmail) {
        try {
          const emailLoginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.username,
              password: credentials.password
            })
          });

          if (emailLoginResponse.ok) {
            const data = await emailLoginResponse.json();
            
            const userInfo = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              username: data.user.email.split('@')[0],
              role: data.user.role,
              wordpressRoles: [],
              loginMethod: 'email',
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              phone: '',
              address1: '',
              address2: '',
              city: '',
              state: '',
              zip: '',
              country: ''
            };
            
            setAuthCookies(data.token, userInfo);
            toast.success('Welcome back!');
            window.location.href = getRedirectUrl(data.user.role);
            return;
          }
        } catch (emailError) {
          console.log('[Login] Email login failed, trying WordPress:', emailError);
          // Fall through to WordPress login
        }
      }
      
      // Try WordPress login
      const response = await fetch(`${WORDPRESS_API_URL}/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      console.log('=== WORDPRESS LOGIN START ===');
      console.log('WordPress JWT Response:', data);
      
      if (data.token) {
        // Try to get roles from JWT response first, or use backend API
        let wordpressRoles: string[] = [];
        let mappedRole: DesignStudioRole = 'client'; // Default to client
        
        // Check if roles are included in the JWT response (user_roles or roles)
        if (data.user_roles && Array.isArray(data.user_roles)) {
          wordpressRoles = data.user_roles;
          mappedRole = mapWordPressRole(wordpressRoles);
          console.log('WordPress Roles from JWT (user_roles):', wordpressRoles);
          console.log('Mapped Design Studio Role:', mappedRole);
          console.log('=== WORDPRESS LOGIN END ===');
        } else if (data.roles && Array.isArray(data.roles)) {
          wordpressRoles = data.roles;
          mappedRole = mapWordPressRole(wordpressRoles);
          console.log('WordPress Roles from JWT (roles):', wordpressRoles);
          console.log('Mapped Design Studio Role:', mappedRole);
          console.log('=== WORDPRESS LOGIN END ===');
        } else {
          // Fetch roles using backend API with admin credentials
          try {
            console.log('Fetching user roles via backend API...');
            const roleResponse = await fetch('/api/wordpress/user-by-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: data.user_email })
            });
            
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              if (roleData.found && roleData.user && roleData.user.roles) {
                wordpressRoles = roleData.user.roles;
                mappedRole = mapWordPressRole(wordpressRoles);
                console.log('WordPress Roles from backend API:', wordpressRoles);
                console.log('Mapped Design Studio Role:', mappedRole);
              }
            }
          } catch (apiError) {
            console.warn('Could not fetch roles from backend API, using default client role:', apiError);
            // Continue with default client role
          }
        }
        
        // Save user info with role
        const userInfo: any = {
          id: data.user_id,
          email: data.user_email,
          name: data.user_display_name,
          username: data.user_nicename,
          role: mappedRole,
          wordpressRoles: wordpressRoles,
          loginMethod: 'wordpress',
          firstName: '',
          lastName: '',
          phone: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        };
        
        console.log('Saving user info:', userInfo);
        
        // Save token and user data to both localStorage and cookies
        setAuthCookies(data.token, userInfo);
        
        // Sync user to database and get the database user ID
        try {
          const dbResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              openId: `wp_${data.user_id}`,
              name: data.user_display_name,
              email: data.user_email,
              loginMethod: 'wordpress',
              role: mappedRole,
              wordpressId: data.user_id,
            })
          });
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.success && dbData.user) {
              // Update userInfo with the database ID and all contact fields
              userInfo.id = dbData.user.id;
              userInfo.firstName = dbData.user.firstName || '';
              userInfo.lastName = dbData.user.lastName || '';
              userInfo.phone = dbData.user.phone || '';
              userInfo.address1 = dbData.user.address1 || '';
              userInfo.address2 = dbData.user.address2 || '';
              userInfo.city = dbData.user.city || '';
              userInfo.state = dbData.user.state || '';
              userInfo.zip = dbData.user.zip || '';
              userInfo.country = dbData.user.country || '';
              console.log('Updated user from database:', userInfo.id, 'with contact fields');
              // Re-save with correct database ID and contact fields
              setAuthCookies(data.token, userInfo);
            }
          }
        } catch (dbError) {
          console.warn('Could not sync user to database:', dbError);
        }
        
        console.log('=== WORDPRESS LOGIN END ===');
        toast.success('Login successful!');
        
        const redirectUrl = getRedirectUrl(mappedRole);
        console.log(`Redirecting to ${redirectUrl}`);
        window.location.href = redirectUrl;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    
    try {
      // Decode the JWT token to get user info
      const credential = credentialResponse.credential;
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const googleUser = JSON.parse(jsonPayload);
      console.log('[Google Login] Google User:', googleUser);
      console.log('[Google Login] Email to check:', googleUser.email);
      
      // Check if email matches a WordPress account
      const email = googleUser.email;
      
      // Try to find matching WordPress account by email using backend API
      try {
        const wpCheckResponse = await fetch('/api/wordpress/user-by-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        });
        
        if (wpCheckResponse.ok) {
          const wpData = await wpCheckResponse.json();
          console.log('[Google Login] Backend API response:', wpData);
          
          if (wpData.found && wpData.user) {
            // Account exists in WordPress - merge accounts
            console.log('[Google Login] Found matching WordPress account:', wpData.user);
            console.log('[Google Login] WordPress roles:', wpData.user.roles);
            
            const wordpressRoles = wpData.user.roles || [];
            const mappedRole = mapWordPressRole(wordpressRoles);
            
            const userInfo: any = {
              id: wpData.user.id,
              email: wpData.user.email,
              name: googleUser.name,
              username: wpData.user.username,
              role: mappedRole,
              wordpressRoles: wordpressRoles,
              loginMethod: 'google',
              googleLinked: true,
              firstName: '',
              lastName: '',
              phone: '',
              address1: '',
              address2: '',
              city: '',
              state: '',
              zip: '',
              country: ''
            };
            
            setAuthCookies(credential, userInfo);
            
            // Sync user to database and get database ID
            try {
              const dbResponse = await fetch('/api/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  openId: `google_${googleUser.sub}`,
                  name: googleUser.name,
                  email: wpData.user.email,
                  loginMethod: 'google',
                  role: mappedRole,
                  wordpressId: wpData.user.id,
                })
              });
              
              if (dbResponse.ok) {
                const dbData = await dbResponse.json();
                if (dbData.success && dbData.user) {
                  userInfo.id = dbData.user.id;
                  userInfo.firstName = dbData.user.firstName || '';
                  userInfo.lastName = dbData.user.lastName || '';
                  userInfo.phone = dbData.user.phone || '';
                  userInfo.address1 = dbData.user.address1 || '';
                  userInfo.address2 = dbData.user.address2 || '';
                  userInfo.city = dbData.user.city || '';
                  userInfo.state = dbData.user.state || '';
                  userInfo.zip = dbData.user.zip || '';
                  userInfo.country = dbData.user.country || '';
                  console.log('[Google Login] Updated user from database:', userInfo.id, 'with contact fields');
                  setAuthCookies(credential, userInfo);
                }
              }
            } catch (dbError) {
              console.warn('[Google Login] Could not sync user to database:', dbError);
            }
            
            toast.success('Logged in with Google! Account linked to WordPress.');
            window.location.href = getRedirectUrl(mappedRole);
            return;
          }
        }
      } catch (error) {
        console.error('[Google Login] Error checking WordPress accounts:', error);
      }
      
      console.log('[Google Login] No WordPress account found, creating new client account');
      
      // No matching WordPress account - create new client account
      const userInfo: any = {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        username: googleUser.email.split('@')[0],
        role: 'client' as DesignStudioRole,
        wordpressRoles: [],
        loginMethod: 'google',
        googleLinked: false,
        firstName: '',
        lastName: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      };
      
      setAuthCookies(credential, userInfo);
      
      // Sync new client to database and get database ID
      try {
        const dbResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            openId: `google_${googleUser.sub}`,
            name: googleUser.name,
            email: googleUser.email,
            loginMethod: 'google',
            role: 'client',
            wordpressId: null,
          })
        });
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          if (dbData.success && dbData.user) {
            userInfo.id = dbData.user.id;
            userInfo.firstName = dbData.user.firstName || '';
            userInfo.lastName = dbData.user.lastName || '';
            userInfo.phone = dbData.user.phone || '';
            userInfo.address1 = dbData.user.address1 || '';
            userInfo.address2 = dbData.user.address2 || '';
            userInfo.city = dbData.user.city || '';
            userInfo.state = dbData.user.state || '';
            userInfo.zip = dbData.user.zip || '';
            userInfo.country = dbData.user.country || '';
            console.log('[Google Login] Updated user from database:', userInfo.id, 'with contact fields');
            setAuthCookies(credential, userInfo);
          }
        }
      } catch (dbError) {
        console.warn('[Google Login] Could not sync new client to database:', dbError);
      }
      
      toast.success('Logged in with Google!');
      window.location.href = getRedirectUrl('client');
      
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login was cancelled or failed');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-10 shadow-ios-2xl">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/ds-logo.png" 
              alt="inventRight Design Studio" 
              className="h-16 mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
          </div>

          <div className="mb-6 p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
            <p className="text-sm text-primary font-medium text-center">
              Use Your inventtraining.com Login To Access Design Studio.
            </p>
          </div>

          <form onSubmit={handleWordPressLogin} className="space-y-5">
            <div>
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="https://inventtraining.com/wp-login.php?action=lostpassword"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot your password?
            </a>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have a WordPress account?</p>
            <p className="mt-1">Sign in with Google to get started!</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <a
              href="https://design.inventright.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                Access The Old Design Studio Site
              </Button>
            </a>
          </div>
        </GlassCard>
      </div>
    </GoogleOAuthProvider>
  );
}
