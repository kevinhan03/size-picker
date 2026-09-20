create table public.fashion_agent_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.fashion_agent_conversations(id) on delete cascade,
  assistant_message_id text not null,
  product_id bigint not null references public.products(id) on delete cascade,
  sentiment text not null check (sentiment in ('positive','negative')),
  reason text check (reason in ('not_my_taste','too_similar','too_plain','too_bold','wrong_condition')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, conversation_id, assistant_message_id, product_id),
  check ((sentiment = 'positive' and reason is null) or (sentiment = 'negative' and reason is not null))
);
create index fashion_agent_feedback_user_created_idx on public.fashion_agent_feedback(user_id, created_at desc);
alter table public.fashion_agent_feedback enable row level security;
revoke all on public.fashion_agent_feedback from public, anon, authenticated;
grant select, insert, update, delete on public.fashion_agent_feedback to service_role;
