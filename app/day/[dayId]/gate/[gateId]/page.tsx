import Link from "next/link";
import { notFound } from "next/navigation";
import { GateCounterBoard } from "@/components/gate-counter";
import { DAY_LABEL_MAP, DAYS, GATE_LABEL_MAP, GATES, type DayId, type GateId } from "@/lib/constants";
import { getCounter } from "@/lib/counter";

type Props = {
  params: Promise<{
    dayId: string;
    gateId: string;
  }>;
};

export default async function GatePage({ params }: Props) {
  const { dayId, gateId } = await params;

  if (!DAYS.some((day) => day.id === dayId) || !GATES.some((gate) => gate.id === gateId)) {
    notFound();
  }

  const row = await getCounter(dayId as DayId, gateId);

  if (!row) {
    notFound();
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <h1>
            {DAY_LABEL_MAP[dayId as DayId]} {GATE_LABEL_MAP[gateId as GateId]}
          </h1>
          <p className="hint">선택한 게이트의 입장과 퇴장을 실시간으로 계수합니다.</p>
        </div>
        <div className="stack">
          <Link href={`/day/${dayId}`} className="pill">
            게이트 선택으로
          </Link>
          <Link href="/admin" className="pill">
            관리자 화면
          </Link>
        </div>
      </div>

      <GateCounterBoard dayId={dayId as DayId} gateId={gateId as GateId} initialRow={row} />
    </main>
  );
}
