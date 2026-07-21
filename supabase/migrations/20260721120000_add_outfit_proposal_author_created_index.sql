create index if not exists outfit_proposals_author_created_at_idx
  on public.outfit_proposals(author_id, created_at desc);
