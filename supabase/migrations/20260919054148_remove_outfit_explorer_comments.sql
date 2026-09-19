-- Comments are no longer part of the outfit explorer product.
-- The table is isolated: dropping it removes its data, index, policies, and triggers.
set local lock_timeout = '5s';

drop table if exists public.outfit_explorer_comments;
