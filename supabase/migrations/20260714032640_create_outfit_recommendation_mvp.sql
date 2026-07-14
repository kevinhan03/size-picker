create table public.outfit_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  situation text not null check (char_length(situation) between 1 and 30),
  mood text not null check (char_length(mood) between 1 and 30),
  description text not null check (char_length(description) between 20 and 500),
  status text not null default 'open' check (status in ('open', 'accepted', 'closed')),
  accepted_proposal_id uuid,
  created_at timestamptz not null default now()
);

create table public.outfit_request_items (
  request_id uuid not null references public.outfit_requests(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  sort_order integer not null check (sort_order >= 0),
  primary key (request_id, product_id),
  unique (request_id, sort_order)
);

create table public.outfit_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.outfit_requests(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  explanation text not null check (char_length(explanation) between 10 and 300),
  created_at timestamptz not null default now(),
  unique (request_id, author_id)
);

create table public.outfit_proposal_items (
  proposal_id uuid not null references public.outfit_proposals(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  sort_order integer not null check (sort_order between 0 and 5),
  primary key (proposal_id, product_id),
  unique (proposal_id, sort_order)
);

alter table public.outfit_requests
  add constraint outfit_requests_accepted_proposal_id_fkey
  foreign key (accepted_proposal_id)
  references public.outfit_proposals(id)
  on delete set null;

create index outfit_requests_status_created_at_idx
  on public.outfit_requests(status, created_at desc);
create index outfit_requests_author_created_at_idx
  on public.outfit_requests(author_id, created_at desc);
create index outfit_request_items_product_idx
  on public.outfit_request_items(product_id);
create index outfit_proposals_request_created_at_idx
  on public.outfit_proposals(request_id, created_at desc);
create index outfit_proposals_author_idx
  on public.outfit_proposals(author_id);
create index outfit_proposal_items_product_idx
  on public.outfit_proposal_items(product_id);

alter table public.outfit_requests enable row level security;
alter table public.outfit_request_items enable row level security;
alter table public.outfit_proposals enable row level security;
alter table public.outfit_proposal_items enable row level security;

revoke all on table public.outfit_requests from anon, authenticated;
revoke all on table public.outfit_request_items from anon, authenticated;
revoke all on table public.outfit_proposals from anon, authenticated;
revoke all on table public.outfit_proposal_items from anon, authenticated;

grant select, insert, update, delete on table public.outfit_requests to service_role;
grant select, insert, update, delete on table public.outfit_request_items to service_role;
grant select, insert, update, delete on table public.outfit_proposals to service_role;
grant select, insert, update, delete on table public.outfit_proposal_items to service_role;
