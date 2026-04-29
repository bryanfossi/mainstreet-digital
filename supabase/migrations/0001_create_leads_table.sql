-- Lead magnet submissions (Free Digital Health Check + future opt-ins)
-- Run this in the Supabase SQL Editor before pointing the API endpoint at the database.

create table if not exists public.leads (
  id            bigserial primary key,
  name          text,
  email         text not null,
  source        text not null default 'health-check',
  submitted_at  timestamptz not null default now(),
  -- Idempotency: same email + source updates the existing row (Postgrest merge-duplicates)
  unique (email, source)
);

create index if not exists leads_submitted_at_idx on public.leads (submitted_at desc);
create index if not exists leads_email_idx        on public.leads (email);

-- Row Level Security: deny by default. The API endpoint uses the service-role key,
-- which bypasses RLS — so no policies are needed for the current architecture.
-- If you ever expose this table to the anon key (e.g. for a self-serve admin UI),
-- you'll need explicit policies.
alter table public.leads enable row level security;
