import type { DayId, GateId } from "@/lib/constants";

export type CounterRow = {
  id: string;
  day_id: DayId;
  gate_id: GateId;
  entered_count: number;
  exited_count: number;
  updated_at: string;
};

export type DaySummary = {
  dayId: DayId;
  dayLabel: string;
  entered: number;
  exited: number;
  current: number;
};
