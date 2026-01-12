export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Google OAuth login URL
export const getLoginUrl = () => {
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '694179851188-snel037oka5nn47302tblrs06s9n4qep.apps.googleusercontent.com';
  
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return url.toString();
};
