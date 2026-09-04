-- Admin-curated products that may be used as training samples when a style
-- prototype is revised. Candidates themselves are calculated at read time;
-- only an explicit admin decision is persisted.
create table if not exists public.style_center_samples (
  style_key text not null check (style_key in (
    'minimal', 'street', 'classic', 'vintage', 'lovely', 'sporty',
    'workwear', 'gorpcore', 'chic_modern', 'glam_sexy'
  )),
  product_id bigint not null references public.products(id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  decided_at timestamptz not null default now(),
  decided_by text,
  primary key (style_key, product_id)
);

create index if not exists style_center_samples_style_key_decision_idx
  on public.style_center_samples (style_key, decision, decided_at desc);

alter table public.style_center_samples enable row level security;
revoke all on public.style_center_samples from anon, authenticated;
grant select, insert, update, delete on public.style_center_samples to service_role;
