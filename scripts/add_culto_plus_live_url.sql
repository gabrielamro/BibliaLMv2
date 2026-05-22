-- Adds optional external live stream URL for Culto+ services.
-- Safe to run multiple times.

alter table public.church_services
  add column if not exists live_url text;
