create table if not exists public.analysis_stats_5m (
  bucket_start timestamptz primary key,
  completed bigint not null default 0 check (completed >= 0),
  total_latency_ms bigint not null default 0 check (total_latency_ms >= 0),
  party_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.analysis_stats_5m is 'Privacy-preserving five-minute aggregates for public usage stats; no prompts or user identifiers are stored.';

alter table public.analysis_stats_5m enable row level security;
revoke all on table public.analysis_stats_5m from public, anon, authenticated;

create or replace function public.record_analysis(p_party_name text, p_latency_ms integer default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_party text := btrim(coalesce(p_party_name, ''));
  clean_latency integer := coalesce(p_latency_ms, 0);
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / 300) * 300);
begin
  if clean_party = '' or length(clean_party) > 120 then
    raise exception 'party name is required';
  end if;
  if clean_latency < 0 or clean_latency > 120000 then
    raise exception 'latency is outside the accepted range';
  end if;

  insert into public.analysis_stats_5m (bucket_start, completed, total_latency_ms, party_counts)
  values (bucket, 1, clean_latency, jsonb_build_object(clean_party, 1))
  on conflict (bucket_start) do update
  set completed = public.analysis_stats_5m.completed + 1,
      total_latency_ms = public.analysis_stats_5m.total_latency_ms + excluded.total_latency_ms,
      party_counts = jsonb_set(
        public.analysis_stats_5m.party_counts,
        array[clean_party],
        to_jsonb(coalesce((public.analysis_stats_5m.party_counts ->> clean_party)::bigint, 0) + 1),
        true
      );
end;
$$;

create or replace function public.get_public_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
with periods as (
  select
    coalesce(sum(completed) filter (where bucket_start >= now() - interval '1 hour'), 0)::bigint as hour_count,
    coalesce(sum(completed) filter (where bucket_start >= now() - interval '2 hours' and bucket_start < now() - interval '1 hour'), 0)::bigint as previous_hour_count,
    coalesce(sum(completed) filter (where bucket_start >= now() - interval '24 hours'), 0)::bigint as day_count,
    coalesce(sum(completed) filter (where bucket_start >= now() - interval '48 hours' and bucket_start < now() - interval '24 hours'), 0)::bigint as previous_day_count,
    coalesce(sum(total_latency_ms) filter (where bucket_start >= now() - interval '24 hours'), 0)::bigint as day_latency_ms,
    coalesce(sum(total_latency_ms) filter (where bucket_start >= now() - interval '48 hours' and bucket_start < now() - interval '24 hours'), 0)::bigint as previous_day_latency_ms,
    coalesce(sum(completed), 0)::bigint as total_count
  from public.analysis_stats_5m
), leaders as (
  select party, sum(entries.party_count::bigint)::bigint as party_count
  from public.analysis_stats_5m s
  cross join lateral jsonb_each_text(s.party_counts) as entries(party, party_count)
  where s.bucket_start >= now() - interval '1 hour'
  group by party
  order by party_count desc, party asc
  limit 1
), spark as (
  select coalesce(jsonb_agg(coalesce(hourly.completed, 0) order by hours.bucket_start), '[]'::jsonb) as values
  from generate_series(
    date_trunc('hour', now()) - interval '23 hours',
    date_trunc('hour', now()),
    interval '1 hour'
  ) as hours(bucket_start)
  left join lateral (
    select sum(s.completed)::bigint as completed
    from public.analysis_stats_5m s
    where s.bucket_start >= hours.bucket_start
      and s.bucket_start < hours.bucket_start + interval '1 hour'
  ) as hourly on true
)
select jsonb_build_object(
  'total', periods.total_count,
  'hour', periods.hour_count,
  'leadName', leaders.party,
  'leadPct', case when periods.hour_count = 0 then 0 else round((leaders.party_count * 100.0 / periods.hour_count)::numeric, 1) end,
  'ms', case when periods.day_count = 0 then 0 else round((periods.day_latency_ms / periods.day_count / 1000.0)::numeric, 2) end,
  'spark', spark.values,
  'totalDeltaPct', case when periods.previous_day_count = 0 then null else round(((periods.day_count - periods.previous_day_count) * 100.0 / periods.previous_day_count)::numeric, 1) end,
  'hourDeltaPct', case when periods.previous_hour_count = 0 then null else round(((periods.hour_count - periods.previous_hour_count) * 100.0 / periods.previous_hour_count)::numeric, 1) end,
  'latencyDeltaMs', case when periods.previous_day_count = 0 then null else round((periods.day_latency_ms * 1.0 / periods.day_count - periods.previous_day_latency_ms * 1.0 / periods.previous_day_count)::numeric, 0) end,
  'updatedAt', now()
)
from periods cross join spark left join leaders on true;
$$;
