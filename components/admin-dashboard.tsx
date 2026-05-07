"use client";

import { useEffect, useMemo, useState } from "react";
import { DAY_LABEL_MAP, DAYS, GATE_LABEL_MAP } from "@/lib/constants";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CounterRow } from "@/lib/types";

type Props = {
  initialRows: CounterRow[];
};

export function AdminDashboard({ initialRows }: Props) {
  const [rows, setRows] = useState<CounterRow[]>(initialRows);
  const [status, setStatus] = useState("실시간 동기화 대기 중");

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    try {
      const supabase = getBrowserSupabase();
      const channel = supabase
        .channel("gate-counts-admin")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "gate_counts",
          },
          (payload) => {
            const next = payload.new as CounterRow;
            setRows((current) =>
              current
                .filter((row) => row.id !== next.id)
                .concat(next)
                .sort((a, b) => a.day_id.localeCompare(b.day_id) || a.gate_id.localeCompare(b.gate_id)),
            );
            setStatus("실시간 반영됨");
          },
        )
        .subscribe((state) => {
          if (state === "SUBSCRIBED") {
            setStatus("실시간 연결됨");
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      setStatus("환경변수 설정 전에는 미리보기 모드입니다.");
    }
  }, []);

  const summary = useMemo(
    () =>
      DAYS.map((day) => {
        const dayRows = rows.filter((row) => row.day_id === day.id);
        const entered = dayRows.reduce((sum, row) => sum + row.entered_count, 0);
        const exited = dayRows.reduce((sum, row) => sum + row.exited_count, 0);

        return {
          dayId: day.id,
          label: DAY_LABEL_MAP[day.id],
          entered,
          exited,
          current: entered - exited,
        };
      }),
    [rows],
  );

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="pill">{status}</div>
      </div>

      <section className="grid day-grid">
        {summary.map((item) => (
          <article key={item.dayId} className="card">
            <h2>{item.label}</h2>
            <div className="metric-row">
              <div className="metric">
                <label>총 입장</label>
                <strong>{item.entered.toLocaleString()}</strong>
              </div>
              <div className="metric">
                <label>총 퇴장</label>
                <strong>{item.exited.toLocaleString()}</strong>
              </div>
              <div className="metric">
                <label>현재 인원</label>
                <strong>{item.current.toLocaleString()}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>게이트별 실시간 현황</h2>
            <p className="hint">운영자가 버튼을 누를 때마다 자동으로 갱신됩니다.</p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>일자</th>
                <th>게이트</th>
                <th>입장 누적</th>
                <th>퇴장 누적</th>
                <th>현재 인원</th>
                <th>최종 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{DAY_LABEL_MAP[row.day_id]}</td>
                  <td>{GATE_LABEL_MAP[row.gate_id]}</td>
                  <td>{row.entered_count.toLocaleString()}</td>
                  <td>{row.exited_count.toLocaleString()}</td>
                  <td>{(row.entered_count - row.exited_count).toLocaleString()}</td>
                  <td>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(row.updated_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
