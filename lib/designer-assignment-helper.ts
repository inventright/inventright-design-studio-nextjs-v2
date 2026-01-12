import { db } from '@/lib/db';
import { designerAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get the first available designer for a specific job type based on priority
 * @param jobType - The type of job (sell_sheets, virtual_prototypes, line_drawings)
 * @returns Designer ID or null if no designers are assigned
 */
export async function getAssignedDesignerForJobType(jobType: string): Promise<number | null> {
  try {
    const assignments = await db
      .select()
      .from(designerAssignments)
      .where(
        and(
          eq(designerAssignments.jobType, jobType),
          eq(designerAssignments.isActive, true)
        )
      )
      .orderBy(designerAssignments.priority)
      .limit(1);

    if (assignments.length > 0) {
      return assignments[0].designerId;
    }

    return null;
  } catch (error) {
    console.error('[Designer Assignment] Error getting assigned designer:', error);
    return null;
  }
}

/**
 * Get all assigned designers for a specific job type
 * @param jobType - The type of job (sell_sheets, virtual_prototypes, line_drawings)
 * @returns Array of designer IDs in priority order
 */
export async function getAllAssignedDesignersForJobType(jobType: string): Promise<number[]> {
  try {
    const assignments = await db
      .select()
      .from(designerAssignments)
      .where(
        and(
          eq(designerAssignments.jobType, jobType),
          eq(designerAssignments.isActive, true)
        )
      )
      .orderBy(designerAssignments.priority);

    return assignments.map(a => a.designerId);
  } catch (error) {
    console.error('[Designer Assignment] Error getting assigned designers:', error);
    return [];
  }
}

/**
 * Map package type to job type for designer assignment
 * @param packageType - The package type from the job
 * @returns Corresponding job type for designer assignment
 */
export function mapPackageTypeToJobType(packageType: string | null): string | null {
  if (!packageType) return null;

  const packageTypeLower = packageType.toLowerCase();

  if (packageTypeLower.includes('sell sheet')) {
    return 'sell_sheets';
  } else if (packageTypeLower.includes('virtual prototype') || packageTypeLower.includes('3d')) {
    return 'virtual_prototypes';
  } else if (packageTypeLower.includes('line drawing') || packageTypeLower.includes('technical')) {
    return 'line_drawings';
  }

  return null;
}
