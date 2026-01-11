import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireDesigner() {
  const user = await requireAuth();
  if (
    user.role !== "designer" &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    redirect("/unauthorized");
  }
  return user;
}

export function hasRole(
  user: { role: string } | undefined,
  roles: string[]
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
