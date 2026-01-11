import { neonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  try {
    const { user } = await neonAuth();
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  // Check if user has admin or manager role
  // Note: Neon Auth stores custom data in user.data
  const role = (user as any).data?.role || "client";
  
  if (role !== "admin" && role !== "manager") {
    redirect("/unauthorized");
  }
  
  return { ...user, role };
}

export async function requireDesigner() {
  const user = await requireAuth();
  
  const role = (user as any).data?.role || "client";
  
  if (
    role !== "designer" &&
    role !== "manager" &&
    role !== "admin"
  ) {
    redirect("/unauthorized");
  }
  
  return { ...user, role };
}

export function hasRole(
  user: { data?: { role?: string } } | undefined,
  roles: string[]
): boolean {
  if (!user) return false;
  const role = (user as any).data?.role || "client";
  return roles.includes(role);
}
