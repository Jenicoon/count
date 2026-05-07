export const DAYS = [
  { id: "day1", label: "1일차" },
  { id: "day2", label: "2일차" },
  { id: "day3", label: "3일차" },
] as const;

export const GATES = [
  { id: "A", label: "GATE A" },
  { id: "B", label: "GATE B" },
  { id: "C", label: "GATE C" },
] as const;

export type DayId = (typeof DAYS)[number]["id"];
export type GateId = (typeof GATES)[number]["id"];

export const DAY_LABEL_MAP = Object.fromEntries(DAYS.map((day) => [day.id, day.label])) as Record<
  DayId,
  string
>;

export const GATE_LABEL_MAP = Object.fromEntries(
  GATES.map((gate) => [gate.id, gate.label]),
) as Record<GateId, string>;
