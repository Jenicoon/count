import Link from "next/link";
import { notFound } from "next/navigation";
import { GateCounterBoard } from "@/components/gate-counter";
import { DAY_LABEL_MAP, DAYS, type DayId } from "@/lib/constants";
import { listCountersByDay } from "@/lib/counter";

type Props = {
  params: Promise<{
    dayId: string;
  }>;
};

export default async function DayPage({ params }: Props) {
  const { dayId } = await params;

  if (!DAYS.some((day) => day.id === dayId)) {
    notFound();
  }

  const rows = await listCountersByDay(dayId as DayId);

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <h1>{DAY_LABEL_MAP[dayId as DayId]} 운영 화면</h1>
          <p className="hint">각 게이트에서 입장/퇴장 버튼을 눌러 인원을 누적합니다.</p>
        </div>
        <div className="stack">
          <Link href="/" className="pill">
            메인으로
          </Link>
          <Link href="/admin" className="pill">
            관리자 화면
          </Link>
        </div>
      </div>

      <GateCounterBoard dayId={dayId as DayId} initialRows={rows} />
    </main>
  );
}
