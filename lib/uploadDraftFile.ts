/**
 * Upload a file immediately to Wasabi for draft persistence
 * Returns the file key that can be stored in localStorage
 */
export async function uploadDraftFile(file: File): Promise<string> {
  // Check file size (limit to 4MB for Vercel)
  const MAX_SIZE = 4 * 1024 * 1024; // 4MB
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is 4MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  try {
    // Get auth credentials
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('wordpress_token');
    const userData = localStorage.getItem('user_data');
    
    // Build FormData for multipart upload (no base64 needed!)
    const formData = new FormData();
    formData.append('file', file);
    
    // Build headers (don't set Content-Type, browser will set it with boundary)
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (userData) {
      headers['X-User-Data'] = userData;
    }
    
    console.log('[Upload] Starting upload:', file.name, 'Size:', file.size);
    console.log('[Upload] Auth token exists:', !!authToken);
    
    const response = await fetch('/api/files/upload-draft', {
      method: 'POST',
      headers,
      credentials: 'include',  // Include cookies
      body: formData,  // Send as multipart/form-data
    });

    console.log('[Upload] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Upload] Error response:', error);
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[Upload] Success:', data);
    return data.fileKey;
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    throw error;
  }
}
