import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "stage-counter-admin";

export type AdminRole = "admin" | "super";

export async function getAdminRole(): Promise<AdminRole | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (cookieValue === "admin" || cookieValue === "super") {
    return cookieValue;
  }

  if (cookieValue === "ok") {
    return "super";
  }

  return null;
}

export async function isAdminAuthenticated() {
  return (await getAdminRole()) !== null;
}

export async function isSuperAdmin() {
  return (await getAdminRole()) === "super";
}
