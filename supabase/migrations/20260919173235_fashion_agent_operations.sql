alter table public.fashion_agent_requests
 add column question text,
 add column locale text,
 add column duration_ms integer,
 add column error_code text,
 add column execution jsonb,
 add column review jsonb;
create index fashion_agent_requests_created_idx on public.fashion_agent_requests(created_at desc, id desc);
