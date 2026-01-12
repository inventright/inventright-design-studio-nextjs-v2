import { useEffect, useRef, useState, useCallback } from "react";
import { saveDraft, loadDraft, clearDraft, formatLastSaved, type JobIntakeDraft } from "@/utils/formStorage";

interface UseDraftAutoSaveOptions {
  userId: number | string;
  enabled?: boolean;
  autoSaveInterval?: number; // milliseconds
  onSave?: () => void;
  onLoad?: (draft: JobIntakeDraft) => void;
}

interface UseDraftAutoSaveReturn {
  save: (draft: Partial<JobIntakeDraft>) => void;
  load: () => JobIntakeDraft | null;
  clear: () => void;
  lastSaved: Date | null;
  lastSavedText: string;
  isSaving: boolean;
}

/**
 * Hook for automatic draft saving and loading
 * 
 * Features:
 * - Auto-saves every N seconds (default 30)
 * - Manual save function
 * - Load draft on mount
 * - Clear draft on demand
 * - Track last saved time
 */
export function useDraftAutoSave({
  userId,
  enabled = true,
  autoSaveInterval = 30000, // 30 seconds
  onSave,
  onLoad,
}: UseDraftAutoSaveOptions): UseDraftAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedText, setLastSavedText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  const draftRef = useRef<Partial<JobIntakeDraft>>({});
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update the "last saved" text every minute
   */
  const updateLastSavedText = useCallback(() => {
    if (lastSaved) {
      setLastSavedText(formatLastSaved(lastSaved));
    }
  }, [lastSaved]);

  /**
   * Save draft to localStorage
   */
  const save = useCallback((draft: Partial<JobIntakeDraft>) => {
    if (!enabled || !userId) return;
    
    setIsSaving(true);
    draftRef.current = draft;
    
    const success = saveDraft(userId, draft);
    
    if (success) {
      const now = new Date();
      setLastSaved(now);
      setLastSavedText(formatLastSaved(now));
      onSave?.();
    }
    
    setIsSaving(false);
  }, [userId, enabled, onSave]);

  /**
   * Load draft from localStorage
   */
  const load = useCallback((): JobIntakeDraft | null => {
    if (!enabled || !userId) return null;
    
    const draft = loadDraft(userId);
    
    if (draft) {
      setLastSaved(new Date(draft.lastSaved));
      onLoad?.(draft);
    }
    
    return draft;
  }, [userId, enabled, onLoad]);

  /**
   * Clear draft from localStorage
   */
  const clear = useCallback(() => {
    if (!userId) return;
    
    clearDraft(userId);
    setLastSaved(null);
    setLastSavedText("");
    draftRef.current = {};
  }, [userId]);

  /**
   * Auto-save on interval
   */
  useEffect(() => {
    if (!enabled || !userId) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (Object.keys(draftRef.current).length > 0) {
        save(draftRef.current);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, userId, autoSaveInterval, save]);

  /**
   * Update "last saved" text every minute
   */
  useEffect(() => {
    updateLastSavedText();
    
    lastSavedTimerRef.current = setInterval(updateLastSavedText, 60000); // Update every minute

    return () => {
      if (lastSavedTimerRef.current) {
        clearInterval(lastSavedTimerRef.current);
      }
    };
  }, [updateLastSavedText]);

  return {
    save,
    load,
    clear,
    lastSaved,
    lastSavedText,
    isSaving,
  };
}
