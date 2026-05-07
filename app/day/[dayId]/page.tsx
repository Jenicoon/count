import Link from "next/link";
import { notFound } from "next/navigation";
import { DAY_LABEL_MAP, DAYS, GATE_LABEL_MAP, type DayId } from "@/lib/constants";
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
          <h1>{DAY_LABEL_MAP[dayId as DayId]} 게이트 선택</h1>
          <p className="hint">운영 중인 게이트를 선택해서 해당 화면에서 입장과 퇴장을 계수합니다.</p>
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

      <section className="grid gate-grid">
        {rows.map((row) => (
          <Link key={row.id} href={`/day/${dayId}/gate/${row.gate_id}`} className="card day-card">
            <strong>{GATE_LABEL_MAP[row.gate_id]}</strong>
            <span>
              현재 인원 {(row.entered_count - row.exited_count).toLocaleString()}명
              <br />
              입장 {row.entered_count.toLocaleString()} / 퇴장 {row.exited_count.toLocaleString()}
            </span>
          </Link>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="section-title">
          <div>
            <h2>{DAY_LABEL_MAP[dayId as DayId]} 안내</h2>
            <p className="hint">전체 합산 인원은 숨기고, 각 게이트별 인원만 확인할 수 있도록 표시됩니다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
