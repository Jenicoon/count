import { NextResponse } from "next/server";
import { DAYS, GATES } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

type RequestBody = {
  dayId?: string;
  gateId?: string;
  action?: "enter" | "exit";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (!body?.dayId || !body?.gateId || !body?.action) {
    return NextResponse.json({ error: "요청 값이 올바르지 않습니다." }, { status: 400 });
  }

  const validDay = DAYS.some((day) => day.id === body.dayId);
  const validGate = GATES.some((gate) => gate.id === body.gateId);

  if (!validDay || !validGate) {
    return NextResponse.json({ error: "알 수 없는 일자 또는 게이트입니다." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase 환경변수가 아직 없어 미리보기 모드입니다. README 설정 후 다시 시도해주세요." },
      { status: 503 },
    );
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.rpc("increment_gate_count", {
    p_day_id: body.dayId,
    p_gate_id: body.gateId,
    p_action: body.action,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
