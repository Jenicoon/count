import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
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
  return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== "ok") {
    return unauthorized();
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase 환경변수가 필요합니다." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body?.dayId || !body?.gateId) {
    return NextResponse.json({ error: "일자와 게이트가 필요합니다." }, { status: 400 });
  }

  if (!DAYS.some((day) => day.id === body.dayId) || !GATES.some((gate) => gate.id === body.gateId)) {
    return NextResponse.json({ error: "일자 또는 게이트 값이 올바르지 않습니다." }, { status: 400 });
  }

  if (
    typeof body.enteredCount !== "number" ||
    typeof body.exitedCount !== "number" ||
    Number.isNaN(body.enteredCount) ||
    Number.isNaN(body.exitedCount) ||
    body.enteredCount < 0 ||
    body.exitedCount < 0
  ) {
    return NextResponse.json({ error: "수정 값은 0 이상의 숫자여야 합니다." }, { status: 400 });
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
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== "ok") {
    return unauthorized();
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase 환경변수가 필요합니다." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  const supabase = createServerSupabase();

  if (body?.scope === "row") {
    if (!body.dayId || !body.gateId) {
      return NextResponse.json({ error: "일자와 게이트가 필요합니다." }, { status: 400 });
    }

    if (!DAYS.some((day) => day.id === body.dayId) || !GATES.some((gate) => gate.id === body.gateId)) {
      return NextResponse.json({ error: "일자 또는 게이트 값이 올바르지 않습니다." }, { status: 400 });
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
      return NextResponse.json({ error: "일자 값이 필요합니다." }, { status: 400 });
    }

    if (!DAYS.some((day) => day.id === body.dayId)) {
      return NextResponse.json({ error: "일자 값이 올바르지 않습니다." }, { status: 400 });
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

  return NextResponse.json({ error: "초기화 대상이 올바르지 않습니다." }, { status: 400 });
}
