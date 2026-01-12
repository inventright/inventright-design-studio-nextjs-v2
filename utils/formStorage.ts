/**
 * Form Storage Utility
 * Handles saving and loading form drafts to/from localStorage
 */

export interface JobIntakeDraft {
  // Common fields
  jobName: string;
  coachName: string;
  howHeard: string;
  memberStatus: string;
  category: string;
  productDescription: string;
  videoLink: string;
  additionalInfo: string;
  legalInfo: string[];
  
  // Department selection
  selectedDepartment: string;
  
  // Sell Sheet fields
  sellSheetLayout: string;
  photoDescription: string;
  problemSolutionDescription: string;
  storyboardDescription: string;
  benefitStatement: string;
  bulletPoints: string;
  
  // Virtual Prototype fields
  vpDimensions: string;
  vpMaterial: string;
  vpColor: string;
  vpFunctionality: string;
  vpSpecialInstructions: string;
  
  // Line Drawing fields
  ldNumberOfViews: string;
  ldDrawingStyle: string;
  ldDimensionRequirements: string;
  ldAnnotationNeeds: string;
  ldSpecialRequirements: string;
  
  // Voucher
  voucherCode: string;
  
  // Metadata
  lastSaved: string;
  step?: number;
}

const STORAGE_KEY_PREFIX = "job-intake-draft";
const STORAGE_VERSION = "v1";

/**
 * Get the storage key for a specific user
 */
export function getDraftKey(userId: number | string): string {
  return `${STORAGE_KEY_PREFIX}-${STORAGE_VERSION}-${userId}`;
}

/**
 * Save draft to localStorage
 */
export function saveDraft(userId: number | string, draft: Partial<JobIntakeDraft>): boolean {
  try {
    const key = getDraftKey(userId);
    const draftWithTimestamp: JobIntakeDraft = {
      ...draft as JobIntakeDraft,
      lastSaved: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(draftWithTimestamp));
    return true;
  } catch (error) {
    console.error("Error saving draft:", error);
    return false;
  }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(userId: number | string): JobIntakeDraft | null {
  try {
    const key = getDraftKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const draft = JSON.parse(stored) as JobIntakeDraft;
    
    // Check if draft is older than 7 days
    const lastSaved = new Date(draft.lastSaved);
    const daysSinceLastSave = (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastSave > 7) {
      // Draft is too old, delete it
      clearDraft(userId);
      return null;
    }
    
    return draft;
  } catch (error) {
    console.error("Error loading draft:", error);
    return null;
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(userId: number | string): void {
  try {
    const key = getDraftKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
}

/**
 * Check if a draft exists for the user
 */
export function hasDraft(userId: number | string): boolean {
  try {
    const key = getDraftKey(userId);
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get the last saved timestamp for a draft
 */
export function getDraftTimestamp(userId: number | string): Date | null {
  try {
    const draft = loadDraft(userId);
    return draft ? new Date(draft.lastSaved) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Format the last saved time for display
 */
export function formatLastSaved(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
}
