import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: { url: string; name: string }[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && onNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && onPrevious) {
        onPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Previous Button */}
      {hasMultiple && onPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* Next Button */}
      {hasMultiple && onNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Image */}
      <div
        className="max-w-7xl max-h-[90vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="text-white text-center">
          <p className="font-medium">{currentImage.name}</p>
          {hasMultiple && (
            <p className="text-sm text-gray-400 mt-1">
              {currentIndex + 1} of {images.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
