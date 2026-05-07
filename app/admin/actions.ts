"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "stage-counter-admin";

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "ok", {
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
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "ok";
}
