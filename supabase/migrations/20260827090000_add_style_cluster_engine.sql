-- Versioned vector-space style models.  Products keep their legacy tags until
-- a reviewed model is activated.
create table if not exists public.style_cluster_model_versions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  feature_config jsonb not null,
  pca_mean jsonb not null,
  pca_components jsonb not null,
  temperature double precision not null default 0.12 check (temperature > 0),
  training_stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create unique index if not exists style_cluster_one_active_model
  on public.style_cluster_model_versions ((status)) where status = 'active';

create table if not exists public.style_clusters (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.style_cluster_model_versions(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  centroid jsonb not null,
  product_count integer not null default 0 check (product_count >= 0),
  mean_distance double precision,
  axis_summary jsonb not null default '{}'::jsonb,
  fact_summary jsonb not null default '{}'::jsonb,
  style_tag text check (style_tag in ('casual','minimal','street','classic','vintage','lovely_romantic','sporty','workwear_gorpcore','chic_modern','glam_sexy')),
  created_at timestamptz not null default now(),
  unique (model_version_id, ordinal)
);

create table if not exists public.product_style_cluster_scores (
  product_id bigint not null references public.products(id) on delete cascade,
  model_version_id uuid not null references public.style_cluster_model_versions(id) on delete cascade,
  cluster_probabilities jsonb not null,
  derived_style_tags jsonb not null,
  nearest_distance double precision not null,
  status text not null default 'scored' check (status in ('pending','scored','missing_inputs','failed')),
  error text,
  scored_at timestamptz not null default now(),
  primary key (product_id, model_version_id)
);

create index if not exists product_style_cluster_scores_version_idx
  on public.product_style_cluster_scores (model_version_id, status);

alter table public.products
  add column if not exists style_cluster_score_status text not null default 'pending',
  add column if not exists style_cluster_score_error text;

alter table public.products drop constraint if exists products_style_cluster_score_status_check;
alter table public.products add constraint products_style_cluster_score_status_check
  check (style_cluster_score_status in ('pending','scored','missing_inputs','failed'));

alter table public.style_cluster_model_versions enable row level security;
alter table public.style_clusters enable row level security;
alter table public.product_style_cluster_scores enable row level security;

revoke all on public.style_cluster_model_versions, public.style_clusters, public.product_style_cluster_scores from anon, authenticated;
grant select, insert, update, delete on public.style_cluster_model_versions, public.style_clusters, public.product_style_cluster_scores to service_role;
