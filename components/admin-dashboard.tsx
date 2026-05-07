"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DAY_LABEL_MAP, DAYS, GATE_LABEL_MAP } from "@/lib/constants";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CounterRow } from "@/lib/types";

type Props = {
  initialRows: CounterRow[];
};

export function AdminDashboard({ initialRows }: Props) {
  const [rows, setRows] = useState<CounterRow[]>(initialRows);
  const [status, setStatus] = useState("실시간 동기화 대기 중");
  const [drafts, setDrafts] = useState<Record<string, { entered: string; exited: string }>>({});
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        initialRows.map((row) => [
          row.id,
          {
            entered: String(row.entered_count),
            exited: String(row.exited_count),
          },
        ]),
      ),
    );
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
            setDrafts((current) => ({
              ...current,
              [next.id]: {
                entered: String(next.entered_count),
                exited: String(next.exited_count),
              },
            }));
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

  async function saveRow(row: CounterRow) {
    const draft = drafts[row.id];
    const entered = Number(draft?.entered);
    const exited = Number(draft?.exited);
    const taskKey = `save-${row.id}`;
    setActiveTask(taskKey);

    startTransition(async () => {
      const response = await fetch("/api/admin/count", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayId: row.day_id,
          gateId: row.gate_id,
          enteredCount: entered,
          exitedCount: exited,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(response.ok ? "관리자 수정이 저장되었습니다." : data?.error ?? "수정에 실패했습니다.");
      setActiveTask(null);
    });
  }

  async function resetScope(scope: "row" | "day" | "all", row?: CounterRow) {
    const taskKey =
      scope === "all" ? "reset-all" : scope === "day" ? `day-${row?.day_id}` : `row-${row?.id}`;
    setActiveTask(taskKey);

    startTransition(async () => {
      const response = await fetch("/api/admin/count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          dayId: row?.day_id,
          gateId: row?.gate_id,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(response.ok ? "초기화가 완료되었습니다." : data?.error ?? "초기화에 실패했습니다.");
      setActiveTask(null);
    });
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="pill">{status}</div>
        <button
          type="button"
          className="pill"
          style={{ cursor: "pointer" }}
          disabled={isPending && activeTask === "reset-all"}
          onClick={() => resetScope("all")}
        >
          전체 초기화
        </button>
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
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="pill"
                style={{ cursor: "pointer" }}
                disabled={isPending && activeTask === `day-${item.dayId}`}
                onClick={() => resetScope("day", rows.find((row) => row.day_id === item.dayId))}
              >
                {item.label} 초기화
              </button>
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
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{DAY_LABEL_MAP[row.day_id]}</td>
                  <td>{GATE_LABEL_MAP[row.gate_id]}</td>
                  <td>
                    <input
                      className="input"
                      style={{ minHeight: 42, width: 110 }}
                      inputMode="numeric"
                      value={drafts[row.id]?.entered ?? String(row.entered_count)}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.id]: {
                            entered: event.target.value,
                            exited: current[row.id]?.exited ?? String(row.exited_count),
                          },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ minHeight: 42, width: 110 }}
                      inputMode="numeric"
                      value={drafts[row.id]?.exited ?? String(row.exited_count)}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.id]: {
                            entered: current[row.id]?.entered ?? String(row.entered_count),
                            exited: event.target.value,
                          },
                        }))
                      }
                    />
                  </td>
                  <td>{(row.entered_count - row.exited_count).toLocaleString()}</td>
                  <td>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(row.updated_at))}</td>
                  <td>
                    <div className="stack">
                      <button
                        type="button"
                        className="pill"
                        style={{ cursor: "pointer" }}
                        disabled={isPending && activeTask === `save-${row.id}`}
                        onClick={() => saveRow(row)}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="pill"
                        style={{ cursor: "pointer" }}
                        disabled={isPending && activeTask === `row-${row.id}`}
                        onClick={() => resetScope("row", row)}
                      >
                        게이트 초기화
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
