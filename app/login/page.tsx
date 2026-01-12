'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { isAuthenticated } from '@/lib/wordpressAuth';
import { mapWordPressRole, type DesignStudioRole } from '@/lib/roleMapping';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://inventtraining.com/wp-json';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '694179851188-snel037oka5nn47302tblrs06s9n4qep.apps.googleusercontent.com';

export default function WordPressLogin() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated()) {
      window.location.href = '/job-intake';
    }
  }, []);

  const handleWordPressLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      
      console.log('WordPress JWT Response:', data);
      
      if (data.token) {
        // Fetch full user data including roles from WordPress REST API
        console.log('Fetching user roles from WordPress REST API...');
        const userResponse = await fetch(`${WORDPRESS_API_URL}/wp/v2/users/${data.user_id}?context=edit`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (userResponse.ok) {
          const fullUserData = await userResponse.json();
          console.log('Full User Data from REST API:', fullUserData);
          
          const wordpressRoles = fullUserData.roles || [];
          console.log('WordPress Roles:', wordpressRoles);
          
          const mappedRole = mapWordPressRole(wordpressRoles);
          console.log('Mapped Design Studio Role:', mappedRole);
          
          // Save token
          localStorage.setItem('auth_token', data.token);
          
          // Save user info with role
          const userInfo = {
            id: data.user_id,
            email: data.user_email,
            name: data.user_display_name,
            username: data.user_nicename,
            role: mappedRole,
            wordpressRoles: wordpressRoles,
            loginMethod: 'wordpress'
          };
          
          console.log('Saving user info:', userInfo);
          localStorage.setItem('user_data', JSON.stringify(userInfo));
          
          toast.success('Login successful!');
          
          console.log('Redirecting to /job-intake');
          window.location.href = '/job-intake';
        } else {
          throw new Error('Failed to fetch user roles');
        }
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
      console.log('Google User:', googleUser);
      
      // Check if email matches a WordPress account
      const email = googleUser.email;
      
      // Try to find matching WordPress account by email
      try {
        const wpCheckResponse = await fetch(`${WORDPRESS_API_URL}/wp/v2/users?search=${encodeURIComponent(email)}`);
        
        if (wpCheckResponse.ok) {
          const wpUsers = await wpCheckResponse.json();
          const matchingUser = wpUsers.find((u: any) => u.email === email);
          
          if (matchingUser) {
            // Account exists in WordPress - merge accounts
            console.log('Found matching WordPress account:', matchingUser);
            
            const wordpressRoles = matchingUser.roles || [];
            const mappedRole = mapWordPressRole(wordpressRoles);
            
            const userInfo = {
              id: matchingUser.id,
              email: matchingUser.email,
              name: googleUser.name,
              username: matchingUser.slug,
              role: mappedRole,
              wordpressRoles: wordpressRoles,
              loginMethod: 'google',
              googleLinked: true
            };
            
            localStorage.setItem('auth_token', credential);
            localStorage.setItem('user_data', JSON.stringify(userInfo));
            
            toast.success('Logged in with Google! Account linked to WordPress.');
            window.location.href = '/job-intake';
            return;
          }
        }
      } catch (error) {
        console.log('Could not check WordPress accounts:', error);
      }
      
      // No matching WordPress account - create new client account
      const userInfo = {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        username: googleUser.email.split('@')[0],
        role: 'client' as DesignStudioRole,
        wordpressRoles: [],
        loginMethod: 'google',
        googleLinked: false
      };
      
      localStorage.setItem('auth_token', credential);
      localStorage.setItem('user_data', JSON.stringify(userInfo));
      
      toast.success('Logged in with Google!');
      window.location.href = '/job-intake';
      
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
              href="https://inventright.com/design-studio/"
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
