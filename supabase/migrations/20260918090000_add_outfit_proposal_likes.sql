create table public.outfit_proposal_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid not null references public.outfit_proposals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, proposal_id)
);

create index outfit_proposal_likes_proposal_idx
  on public.outfit_proposal_likes(proposal_id);

alter table public.outfit_proposal_likes enable row level security;

revoke all on table public.outfit_proposal_likes from anon, authenticated;
grant select, insert, update, delete on table public.outfit_proposal_likes to service_role;

create policy "deny direct outfit proposal like access"
  on public.outfit_proposal_likes for all to anon, authenticated
  using (false) with check (false);
