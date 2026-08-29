alter table public.style_cluster_model_versions
  add column if not exists algorithm text not null default 'spherical_kmeans',
  add column if not exists selection_score double precision,
  add column if not exists is_operational boolean not null default true;

alter table public.style_cluster_model_versions drop constraint if exists style_cluster_model_algorithm_check;
alter table public.style_cluster_model_versions add constraint style_cluster_model_algorithm_check
  check (algorithm in ('spherical_kmeans', 'gaussian_mixture', 'hdbscan'));
