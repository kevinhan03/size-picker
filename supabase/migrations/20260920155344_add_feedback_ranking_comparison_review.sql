alter table public.fashion_agent_requests
  add column if not exists comparison_review jsonb;

comment on column public.fashion_agent_requests.comparison_review is
  'Admin blind review of the baseline and feedback-aware shadow rankings stored in execution events.';
