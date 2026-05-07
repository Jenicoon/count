import Link from "next/link";
import { DAYS } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">STAGE FLOW CONTROL</span>
        <h1 className="title">무대 입퇴장 인원을 여러 운영자가 동시에 계수하는 사이트</h1>
        <p className="subtitle">
          일자별 운영 화면에서 게이트 단위로 입장과 퇴장을 즉시 기록하고, 관리자 화면에서는 전체 현황을
          실시간으로 확인할 수 있게 구성했습니다.
        </p>
      </section>

      <section className="grid day-grid">
        {DAYS.map((day) => (
          <Link key={day.id} href={`/day/${day.id}`} className="card day-card">
            <strong>{day.label}</strong>
            <span>GATE A, GATE B, GATE C 운영 화면으로 이동해서 입장/퇴장 인원을 바로 기록합니다.</span>
          </Link>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="section-title">
          <div>
            <h2>관리자 화면</h2>
            <p className="hint">실시간 합계와 게이트별 누적 현황을 확인할 수 있습니다.</p>
          </div>
          <Link href="/admin" className="pill">
            관리자 페이지 열기
          </Link>
        </div>
      </section>
    </main>
  );
}
