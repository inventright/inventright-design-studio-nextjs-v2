'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, X } from 'lucide-react';
import { Button } from './button';
import { uploadDraftFile } from '@/lib/uploadDraftFile';
import { toast } from 'sonner';

interface FileUploadInputProps {
  label: string;
  value: string; // file key
  onChange: (fileKey: string) => void;
  draftJobId?: string | number | null; // draft job ID for immediate upload
  accept?: string;
  placeholder?: string;
}

export function FileUploadInput({
  label,
  value,
  onChange,
  draftJobId,
  accept = 'image/*',
  placeholder = 'No file selected',
}: FileUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUploadInput] File select triggered');
    console.log('[FileUploadInput] Draft job ID:', draftJobId);
    
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[FileUploadInput] No file selected');
      return;
    }
    
    console.log('[FileUploadInput] File selected:', file.name, 'Size:', file.size);

    // Check file size (4MB limit for Vercel)
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      console.log('[FileUploadInput] File too large:', file.size);
      toast.error(`File too large. Maximum size is 4MB.`);
      return;
    }
    
    if (!draftJobId) {
      console.error('[FileUploadInput] No draft job ID available');
      toast.error('Unable to upload: No draft job ID');
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      const fileKey = await uploadDraftFile(file, draftJobId);
      onChange(fileKey);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || `Failed to upload ${file.name}`);
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-${label.replace(/\s+/g, '-')}`}
          />
          <label
            htmlFor={`file-${label.replace(/\s+/g, '-')}`}
            className="flex items-center justify-between w-full px-3 py-2 glass border border-[#4791FF]/30 rounded-md cursor-pointer hover:border-[#4791FF]/50 transition-colors"
          >
            <span className="text-sm text-gray-700 truncate">
              {fileName || (value ? 'File uploaded' : placeholder)}
            </span>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#4791FF]" />
            ) : value ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Upload className="h-4 w-4 text-gray-400" />
            )}
          </label>
        </div>
        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
