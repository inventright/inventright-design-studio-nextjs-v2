"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Check, Image as ImageIcon, X } from "lucide-react";

interface MediaItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

export default function MediaLibraryModal({
  open,
  onClose,
  onSelectImage,
}: MediaLibraryModalProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchMediaItems();
    }
  }, [open]);

  const fetchMediaItems = async () => {
    try {
      const response = await fetch("/api/email-media");
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data);
      } else {
        toast.error("Failed to fetch media library");
      }
    } catch (error) {
      toast.error("Error fetching media library");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/email-media", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Image uploaded successfully");
        fetchMediaItems();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    // Optimistic UI update - remove immediately
    const previousItems = mediaItems;
    setMediaItems(mediaItems.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }

    try {
      const response = await fetch(`/api/email-media?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Image deleted successfully");
      } else {
        // Revert on error
        toast.error("Failed to delete image");
        setMediaItems(previousItems);
      }
    } catch (error) {
      // Revert on error
      toast.error("Error deleting image");
      setMediaItems(previousItems);
    }
  };

  const handleInsert = () => {
    const selectedItem = mediaItems.find((item) => item.id === selectedId);
    if (selectedItem) {
      onSelectImage(selectedItem.fileUrl);
      onClose();
    } else {
      toast.error("Please select an image");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Upload and manage images for your email templates
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Section */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex items-center justify-center">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {uploading ? "Uploading..." : "Click to upload image"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Max 5MB • JPG, PNG, GIF, WebP
                  </span>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Media Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading media library...</p>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No images yet</p>
              <p className="text-sm text-gray-400">
                Upload your first image to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedId === item.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <img
                      src={item.fileUrl}
                      alt={item.fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Selected Indicator */}
                  {selectedId === item.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Info */}
                  <div className="p-2 bg-white border-t">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {item.fileName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(item.fileSize)}
                      </span>
                      {item.width && item.height && (
                        <span className="text-xs text-gray-500">
                          {item.width} × {item.height}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedId}
          >
            <Check className="w-4 h-4 mr-2" />
            Insert Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
