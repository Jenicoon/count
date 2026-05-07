"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, getAdminRole } from "@/lib/admin-auth";

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  let role: "admin" | "super" | null = null;

  if (superAdminPassword && password === superAdminPassword) {
    role = "super";
  } else if (adminPassword && password === adminPassword) {
    role = superAdminPassword ? "admin" : "super";
  }

  if (!role) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}

export async function isAdminAuthenticated() {
  return (await getAdminRole()) !== null;
}
