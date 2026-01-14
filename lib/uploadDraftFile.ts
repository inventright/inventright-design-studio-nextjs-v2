/**
 * Upload a file immediately to Wasabi using draft job ID
 * Returns the file key that can be stored in localStorage
 */
export async function uploadDraftFile(file: File, draftJobId?: string | null): Promise<string> {
  // Check file size (limit to 4MB for Vercel)
  const MAX_SIZE = 4 * 1024 * 1024; // 4MB
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is 4MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (!draftJobId) {
    throw new Error('Draft job ID is required for file upload');
  }
  
  try {
    // Get auth credentials
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('wordpress_token');
    const userData = localStorage.getItem('user_data');
    
    // Build FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobId', draftJobId); // Use draft job ID
    
    // Build headers (don't set Content-Type, browser will set it with boundary)
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (userData) {
      headers['X-User-Data'] = userData;
    }
    
    console.log('[Upload] Starting upload:', file.name, 'to draft job:', draftJobId);
    console.log('[Upload] Auth token exists:', !!authToken);
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    console.log('[Upload] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Upload] Error response:', error);
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[Upload] Success:', data);
    
    // Return the file URL or key
    return data.fileUrl || data.fileKey || data.url;
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    throw error;
  }
}
