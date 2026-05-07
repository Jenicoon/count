"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CounterRow } from "@/lib/types";
import { GATE_LABEL_MAP, type DayId, type GateId } from "@/lib/constants";

type Props = {
  dayId: DayId;
  initialRows: CounterRow[];
};

export function GateCounterBoard({ dayId, initialRows }: Props) {
  const [rows, setRows] = useState<CounterRow[]>(initialRows);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("실시간 동기화 대기 중");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    try {
      const supabase = getBrowserSupabase();
      const channel = supabase
        .channel(`gate-counts-${dayId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "gate_counts",
            filter: `day_id=eq.${dayId}`,
          },
          (payload) => {
            const next = payload.new as CounterRow;
            setRows((current) =>
              current
                .filter((row) => row.id !== next.id)
                .concat(next)
                .sort((a, b) => a.gate_id.localeCompare(b.gate_id)),
            );
            setMessage("실시간 반영됨");
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setMessage("실시간 연결됨");
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      setMessage("환경변수 설정 전에는 미리보기 모드로 보입니다.");
    }
  }, [dayId]);

  const currentTotal = useMemo(
    () => rows.reduce((sum, row) => sum + row.entered_count - row.exited_count, 0),
    [rows],
  );

  async function updateCount(gateId: GateId, action: "enter" | "exit") {
    const requestKey = `${gateId}-${action}`;
    setPendingKey(requestKey);

    startTransition(async () => {
      const response = await fetch("/api/count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayId,
          gateId,
          action,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(data?.error ?? "업데이트에 실패했습니다.");
      }

      setPendingKey(null);
    });
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="pill">현재 총 입장 인원 {currentTotal.toLocaleString()}명</div>
        <div className="pill">{message}</div>
      </div>

      <section className="grid gate-grid">
        {rows.map((row) => {
          const current = row.entered_count - row.exited_count;

          return (
            <article key={row.id} className="card counter">
              <div className="section-title">
                <div>
                  <h2>{GATE_LABEL_MAP[row.gate_id]}</h2>
                  <p className="hint">각 버튼은 1명씩 누적되며 여러 운영자가 동시에 사용해도 DB에서 원자적으로 합산됩니다.</p>
                </div>
              </div>

              <div className="metric-row">
                <div className="metric">
                  <label>입장 누적</label>
                  <strong>{row.entered_count.toLocaleString()}</strong>
                </div>
                <div className="metric">
                  <label>퇴장 누적</label>
                  <strong>{row.exited_count.toLocaleString()}</strong>
                </div>
                <div className="metric">
                  <label>현재 인원</label>
                  <strong>{current.toLocaleString()}</strong>
                </div>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="button button-enter"
                  disabled={isPending && pendingKey === `${row.gate_id}-enter`}
                  onClick={() => updateCount(row.gate_id, "enter")}
                >
                  입장 +1
                </button>
                <button
                  type="button"
                  className="button button-exit"
                  disabled={isPending && pendingKey === `${row.gate_id}-exit`}
                  onClick={() => updateCount(row.gate_id, "exit")}
                >
                  퇴장 +1
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
