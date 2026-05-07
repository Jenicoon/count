create extension if not exists pgcrypto;

create table if not exists public.gate_counts (
  id uuid primary key default gen_random_uuid(),
  day_id text not null check (day_id in ('day1', 'day2', 'day3')),
  gate_id text not null check (gate_id in ('A', 'B', 'C')),
  entered_count integer not null default 0,
  exited_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (day_id, gate_id)
);

insert into public.gate_counts (day_id, gate_id)
values
  ('day1', 'A'),
  ('day1', 'B'),
  ('day1', 'C'),
  ('day2', 'A'),
  ('day2', 'B'),
  ('day2', 'C'),
  ('day3', 'A'),
  ('day3', 'B'),
  ('day3', 'C')
on conflict (day_id, gate_id) do nothing;

create or replace function public.increment_gate_count(
  p_day_id text,
  p_gate_id text,
  p_action text
)
returns void
language plpgsql
security definer
as $$
begin
  update public.gate_counts
  set
    entered_count = case when p_action = 'enter' then entered_count + 1 else entered_count end,
    exited_count = case when p_action = 'exit' then exited_count + 1 else exited_count end,
    updated_at = now()
  where day_id = p_day_id and gate_id = p_gate_id;
end;
$$;

alter table public.gate_counts replica identity full;

alter publication supabase_realtime add table public.gate_counts;

create policy "allow read gate counts"
on public.gate_counts
for select
to anon, authenticated
using (true);
