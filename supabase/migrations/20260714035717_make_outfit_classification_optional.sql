alter table public.outfit_requests
  alter column situation drop not null,
  alter column mood drop not null;
