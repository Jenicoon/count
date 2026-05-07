import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/admin-auth";
import { DAYS, GATES } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

type UpdateBody = {
  scope?: "row" | "day" | "all";
  dayId?: string;
  gateId?: string;
  enteredCount?: number;
  exitedCount?: number;
};

function unauthorized() {
  return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "슈퍼 관리자만 수정할 수 있습니다." }, { status: 403 });
}

async function requireSuperAdmin() {
  const role = await getAdminRole();

  if (!role) {
    return unauthorized();
  }

  if (role !== "super") {
    return forbidden();
  }

  return null;
}

export async function PATCH(request: Request) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return authError;
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase environment variables are required." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body?.dayId || !body?.gateId) {
    return NextResponse.json({ error: "dayId and gateId are required." }, { status: 400 });
  }

  if (!DAYS.some((day) => day.id === body.dayId) || !GATES.some((gate) => gate.id === body.gateId)) {
    return NextResponse.json({ error: "Invalid day or gate." }, { status: 400 });
  }

  if (
    typeof body.enteredCount !== "number" ||
    typeof body.exitedCount !== "number" ||
    Number.isNaN(body.enteredCount) ||
    Number.isNaN(body.exitedCount) ||
    body.enteredCount < 0 ||
    body.exitedCount < 0
  ) {
    return NextResponse.json({ error: "Counts must be non-negative numbers." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("gate_counts")
    .update({
      entered_count: Math.floor(body.enteredCount),
      exited_count: Math.floor(body.exitedCount),
      updated_at: new Date().toISOString(),
    })
    .eq("day_id", body.dayId)
    .eq("gate_id", body.gateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return authError;
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase environment variables are required." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  const supabase = createServerSupabase();

  if (body?.scope === "row") {
    if (!body.dayId || !body.gateId) {
      return NextResponse.json({ error: "dayId and gateId are required." }, { status: 400 });
    }

    if (!DAYS.some((day) => day.id === body.dayId) || !GATES.some((gate) => gate.id === body.gateId)) {
      return NextResponse.json({ error: "Invalid day or gate." }, { status: 400 });
    }

    const { error } = await supabase
      .from("gate_counts")
      .update({
        entered_count: 0,
        exited_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("day_id", body.dayId)
      .eq("gate_id", body.gateId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body?.scope === "day") {
    if (!body.dayId) {
      return NextResponse.json({ error: "dayId is required." }, { status: 400 });
    }

    if (!DAYS.some((day) => day.id === body.dayId)) {
      return NextResponse.json({ error: "Invalid day." }, { status: 400 });
    }

    const { error } = await supabase
      .from("gate_counts")
      .update({
        entered_count: 0,
        exited_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("day_id", body.dayId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body?.scope === "all") {
    const { error } = await supabase.from("gate_counts").update({
      entered_count: 0,
      exited_count: 0,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid reset scope." }, { status: 400 });
}
