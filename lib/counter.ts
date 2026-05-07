import { DAY_LABEL_MAP, DAYS, GATE_LABEL_MAP, GATES, type DayId } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CounterRow, DaySummary } from "@/lib/types";

export async function listCountersByDay(dayId: DayId): Promise<CounterRow[]> {
  if (!hasSupabaseEnv()) {
    return GATES.map((gate) => ({
      id: `${dayId}-${gate.id}`,
      day_id: dayId,
      gate_id: gate.id,
      entered_count: 0,
      exited_count: 0,
      updated_at: new Date().toISOString(),
    }));
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("gate_counts")
    .select("*")
    .eq("day_id", dayId)
    .order("gate_id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as CounterRow[];
}

export async function getCounter(dayId: DayId, gateId: string): Promise<CounterRow | null> {
  const rows = await listCountersByDay(dayId);
  return rows.find((row) => row.gate_id === gateId) ?? null;
}

export async function listAllCounters(): Promise<CounterRow[]> {
  if (!hasSupabaseEnv()) {
    return DAYS.flatMap((day) =>
      GATES.map((gate) => ({
        id: `${day.id}-${gate.id}`,
        day_id: day.id,
        gate_id: gate.id,
        entered_count: 0,
        exited_count: 0,
        updated_at: new Date().toISOString(),
      })),
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("gate_counts").select("*").order("day_id").order("gate_id");

  if (error) {
    throw new Error(error.message);
  }

  return data as CounterRow[];
}

export function summarizeDays(rows: CounterRow[]): DaySummary[] {
  return DAYS.map((day) => {
    const dayRows = rows.filter((row) => row.day_id === day.id);
    const entered = dayRows.reduce((sum, row) => sum + row.entered_count, 0);
    const exited = dayRows.reduce((sum, row) => sum + row.exited_count, 0);

    return {
      dayId: day.id,
      dayLabel: DAY_LABEL_MAP[day.id],
      entered,
      exited,
      current: entered - exited,
    };
  });
}

export function toGateView(row: CounterRow) {
  return {
    ...row,
    dayLabel: DAY_LABEL_MAP[row.day_id],
    gateLabel: GATE_LABEL_MAP[row.gate_id],
    current: row.entered_count - row.exited_count,
  };
}
