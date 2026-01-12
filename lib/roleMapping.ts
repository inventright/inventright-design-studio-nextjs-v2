/**
 * Maps WordPress user roles to Design Studio roles
 */

export type DesignStudioRole = 'admin' | 'manager' | 'designer' | 'client';

/**
 * WordPress role to Design Studio role mapping
 */
const ROLE_MAPPING: Record<string, DesignStudioRole> = {
  // Admin roles
  'administrator': 'admin',
  'admin': 'admin',
  
  // Manager roles
  'editor': 'manager',
  'shop_manager': 'manager',
  'manager': 'manager',
  
  // Designer roles
  'author': 'designer',
  'contributor': 'designer',
  'designer': 'designer',
  
  // Client roles (default)
  'subscriber': 'client',
  'customer': 'client',
  'client': 'client',
};

/**
 * Maps a WordPress role to a Design Studio role
 * @param wordpressRole - The WordPress role string
 * @returns The corresponding Design Studio role
 */
export function mapWordPressRole(wordpressRole: string | string[]): DesignStudioRole {
  console.log('[Role Mapping] Input:', wordpressRole);
  
  // Handle array of roles (take the first one with highest priority)
  if (Array.isArray(wordpressRole)) {
    console.log('[Role Mapping] Processing array of roles:', wordpressRole);
    // Priority order: admin > manager > designer > client
    const priorityOrder: DesignStudioRole[] = ['admin', 'manager', 'designer', 'client'];
    
    for (const priority of priorityOrder) {
      for (const role of wordpressRole) {
        const mappedRole = ROLE_MAPPING[role.toLowerCase()];
        console.log(`[Role Mapping] Checking role "${role}" -> mapped to "${mappedRole}"`);
        if (mappedRole === priority) {
          console.log(`[Role Mapping] MATCH! Returning "${mappedRole}"`);
          return mappedRole;
        }
      }
    }
    
    // If no match found, use the first role
    if (wordpressRole.length > 0) {
      const firstRole = ROLE_MAPPING[wordpressRole[0].toLowerCase()];
      console.log(`[Role Mapping] No priority match, using first role "${wordpressRole[0]}" -> "${firstRole}"`);
      if (firstRole) return firstRole;
    }
  } else {
    // Handle single role string
    console.log('[Role Mapping] Processing single role:', wordpressRole);
    const mappedRole = ROLE_MAPPING[wordpressRole.toLowerCase()];
    console.log(`[Role Mapping] Mapped to: "${mappedRole}"`);
    if (mappedRole) return mappedRole;
  }
  
  // Default to client if no mapping found
  console.log('[Role Mapping] No mapping found, defaulting to client');
  return 'client';
}

/**
 * Gets the display name for a role
 */
export function getRoleDisplayName(role: DesignStudioRole): string {
  const displayNames: Record<DesignStudioRole, string> = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'designer': 'Designer',
    'client': 'Client'
  };
  
  return displayNames[role] || 'Client';
}
