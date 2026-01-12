import { useEffect, useRef, useState } from "react";

interface UseCompositionOptions<T extends HTMLElement> {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
}

export function useComposition<T extends HTMLElement>(
  options?: UseCompositionOptions<T>
) {
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<T>) => {
    if (options?.onKeyDown) {
      options.onKeyDown(e);
    }
  };

  const handleCompositionStart = (e: React.CompositionEvent<T>) => {
    setIsComposing(true);
    if (options?.onCompositionStart) {
      options.onCompositionStart(e);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<T>) => {
    setIsComposing(false);
    if (options?.onCompositionEnd) {
      options.onCompositionEnd(e);
    }
  };

  return {
    isComposing,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  };
}
