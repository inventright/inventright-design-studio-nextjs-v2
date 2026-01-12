import { useState, useEffect } from "react";
import { X, File, FileText, FileImage, FileVideo, FileAudio, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onPreview?: () => void;
}

export default function FilePreview({ file, onRemove, onPreview }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setLoading(false);
      };
      
      reader.onerror = () => {
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } else {
      setLoading(false);
    }

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return <FileImage className="w-6 h-6" />;
    if (file.type.startsWith("video/")) return <FileVideo className="w-6 h-6" />;
    if (file.type.startsWith("audio/")) return <FileAudio className="w-6 h-6" />;
    if (file.type.includes("pdf")) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  return (
    <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Preview Area */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        ) : preview ? (
          <>
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
            {onPreview && (
              <button
                onClick={onPreview}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <ZoomIn className="w-8 h-8 text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {getFileIcon()}
            <span className="text-xs font-medium uppercase">
              {file.type.split("/")[1] || "FILE"}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Remove Button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
