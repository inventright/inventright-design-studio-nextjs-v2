import { useEffect, useRef, useState } from "react";

export function useComposition() {
  const [isComposing, setIsComposing] = useState(false);

  return {
    isComposing,
    onCompositionStart: () => setIsComposing(true),
    onCompositionEnd: () => setIsComposing(false),
  };
}
