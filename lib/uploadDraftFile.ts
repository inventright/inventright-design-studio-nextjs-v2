/**
 * Upload a file immediately to Wasabi for draft persistence
 * Returns the file key that can be stored in localStorage
 */
export async function uploadDraftFile(file: File): Promise<string> {
  // Check file size (limit to 10MB for base64)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        // Get auth credentials
        const authToken = localStorage.getItem('auth_token') || localStorage.getItem('wordpress_token');
        const userData = localStorage.getItem('user_data');
        
        // Build headers with authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
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
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type,
          }),
        });

        console.log('[Upload] Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('[Upload] Error response:', error);
          throw new Error(error.error || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('[Upload] Success:', data);
        resolve(data.fileKey);
      } catch (error: any) {
        console.error('[Upload] Error:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error('[Upload] FileReader error');
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
