-- Server-only social data. Existing posts and comments are preserved.
alter table public.outfit_explorer_posts
  add column caption text not null default '' check (char_length(caption) <= 2200),
  add column updated_at timestamptz not null default now(),
  add column status text not null default 'published' check (status in ('published', 'draft'));
create index social_posts_feed_idx on public.outfit_explorer_posts(created_at desc, id desc) where status = 'published';
create index social_posts_author_feed_idx on public.outfit_explorer_posts(user_id, created_at desc, id desc) where status = 'published';

create table public.social_uploads (
 id uuid primary key, user_id uuid references auth.users(id) on delete set null,
 path text not null unique, width integer not null, height integer not null,
 created_at timestamptz not null default now(), used boolean not null default false
);
create table public.outfit_explorer_images (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.outfit_explorer_posts(id) on delete cascade,
 image_path text not null unique, position integer not null check(position between 0 and 9),
 width integer, height integer, unique(post_id, position) deferrable initially deferred
);
insert into public.outfit_explorer_images(post_id, image_path, position)
 select id, image_path, 0 from public.outfit_explorer_posts;
create table public.outfit_explorer_tags (
 id uuid primary key default gen_random_uuid(),
 image_id uuid not null references public.outfit_explorer_images(id) on delete cascade,
 product_id bigint references public.products(id) on delete set null,
 x double precision not null check(x >= 0 and x <= 1),
 y double precision not null check(y >= 0 and y <= 1),
 snapshot jsonb not null
);
create index social_tags_image_idx on public.outfit_explorer_tags(image_id);
create index social_tags_product_idx on public.outfit_explorer_tags(product_id);
create table public.social_likes (
 user_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid not null references public.outfit_explorer_posts(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id, post_id)
);
create index social_likes_post_idx on public.social_likes(post_id);
create table public.social_saves (
 user_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid not null references public.outfit_explorer_posts(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id, post_id)
);
create index social_saves_post_idx on public.social_saves(post_id);
create index social_saves_feed_idx on public.social_saves(user_id, created_at desc, post_id desc);
create table public.social_follows (
 follower_id uuid not null references public.users(id) on delete cascade,
 following_id uuid not null references public.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(follower_id, following_id),
 check(follower_id <> following_id)
);
create index social_followers_idx on public.social_follows(following_id, created_at desc, follower_id);
create index social_following_idx on public.social_follows(follower_id, created_at desc, following_id);
create table public.social_file_cleanup (
 path text primary key, created_at timestamptz not null default now()
);

do $$ declare t text; begin
 foreach t in array array['social_uploads','outfit_explorer_images','outfit_explorer_tags','social_likes','social_saves','social_follows','social_file_cleanup'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('revoke all on table public.%I from anon, authenticated', t);
  execute format('grant all on table public.%I to service_role', t);
 end loop;
end $$;

create or replace function private.social_queue_image_cleanup() returns trigger
 language plpgsql security definer set search_path = '' as $$
begin
 insert into public.social_file_cleanup(path) values(old.image_path) on conflict do nothing;
 return old;
end $$;
revoke all on function private.social_queue_image_cleanup() from public, anon, authenticated;
create trigger social_queue_image_cleanup after delete on public.outfit_explorer_images
 for each row execute function private.social_queue_image_cleanup();

-- Auth deletion queues files transactionally before removing the author's posts.
create or replace function private.social_delete_author_posts() returns trigger
 language plpgsql security definer set search_path = '' as $$
begin
 delete from public.outfit_explorer_posts where user_id = old.id;
 insert into public.social_file_cleanup(path) select path from public.social_uploads where user_id = old.id and not used on conflict do nothing;
 return old;
end $$;
revoke all on function private.social_delete_author_posts() from public, anon, authenticated;
create trigger social_delete_author_posts before delete on auth.users
 for each row execute function private.social_delete_author_posts();

-- Single transaction: lock author/closet state, validate media/tags, publish.
create or replace function public.social_publish_post(actor uuid, payload jsonb, editing boolean default false)
 returns uuid language plpgsql security invoker set search_path = '' as $$
declare
 pid uuid := (payload->>'id')::uuid; owner_id uuid; current_updated timestamptz;
 img jsonb; tag jsonb; iid uuid; replacement_id uuid; media public.social_uploads; existing public.outfit_explorer_images; old_path text;
 old_tag public.outfit_explorer_tags; prod public.products; tag_id uuid; product_key bigint;
 snapshot_value jsonb; image_ids uuid[] := '{}'; kept_tags uuid[] := '{}'; pos integer := 0;
begin
 perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));
 if actor is null or not exists(select 1 from public.users where id = actor) then raise exception 'unauthorized'; end if;
 if jsonb_typeof(payload->'caption') <> 'string' or char_length(payload->>'caption') > 2200
   or jsonb_typeof(payload->'images') <> 'array' or jsonb_array_length(payload->'images') not between 1 and 10 then raise exception 'invalid_input'; end if;
 select user_id, updated_at into owner_id, current_updated from public.outfit_explorer_posts where id = pid for update;
 if found then
  if owner_id is distinct from actor and not exists(select 1 from public.users where id = actor and username = 'Kevin_Han') then raise exception 'forbidden'; end if;
  if not editing then return pid; end if;
  if (payload->>'updatedAt')::timestamptz is distinct from current_updated then raise exception 'conflict'; end if;
 else
  if editing then raise exception 'not_found'; end if;
  owner_id := actor;
  insert into public.outfit_explorer_posts(id,user_id,uploader_name,image_path,status)
   select pid,actor,username,'pending/' || pid,'draft' from public.users where id = actor;
 end if;
 for img in select value from jsonb_array_elements(payload->'images') loop
  iid := (img->>'id')::uuid;
  replacement_id := nullif(img->>'replacementUploadId','')::uuid;
  if iid = any(image_ids) or jsonb_typeof(img->'tags') <> 'array' or jsonb_array_length(img->'tags') > 10 then raise exception 'invalid_input'; end if;
  image_ids := array_append(image_ids,iid);
  select * into existing from public.outfit_explorer_images where id = iid and post_id = pid;
  if not found then
   if replacement_id is not null then raise exception 'invalid_input'; end if;
   select * into media from public.social_uploads where id = iid and user_id = actor and not used and created_at > now() - interval '24 hours' for update;
   if not found then raise exception 'invalid_upload'; end if;
   insert into public.outfit_explorer_images(id,post_id,image_path,position,width,height) values(iid,pid,media.path,pos,media.width,media.height);
   update public.social_uploads set used = true where id = iid;
  else
   update public.outfit_explorer_images set position = pos where id = iid;
   if replacement_id is not null then
    select * into media from public.social_uploads where id = replacement_id and user_id = actor and not used and created_at > now() - interval '24 hours' for update;
    if not found then raise exception 'invalid_upload'; end if;
    old_path := existing.image_path;
    update public.outfit_explorer_images set image_path = media.path, width = media.width, height = media.height where id = iid;
    update public.social_uploads set used = true where id = replacement_id;
    insert into public.social_file_cleanup(path) values(old_path) on conflict do nothing;
   end if;
  end if;
  for tag in select value from jsonb_array_elements(img->'tags') loop
   if (tag->>'x') is null or (tag->>'y') is null or (tag->>'x')::float8 not between 0 and 1 or (tag->>'y')::float8 not between 0 and 1 then raise exception 'invalid_input'; end if;
   old_tag := null;
   if tag->>'existingTagId' is not null then
    select * into old_tag from public.outfit_explorer_tags where id = (tag->>'existingTagId')::uuid and image_id = iid;
    if not found or old_tag.id = any(kept_tags) then raise exception 'invalid_input'; end if;
   end if;
   if old_tag.id is not null then
    if old_tag.product_id::text is distinct from tag->>'productId' then raise exception 'invalid_input'; end if;
    tag_id := old_tag.id; product_key := old_tag.product_id; snapshot_value := old_tag.snapshot;
   else
    product_key := (tag->>'productId')::bigint;
    perform 1 from public.user_closet_items where user_id = owner_id and product_id = product_key::text for share;
    if not found then raise exception 'not_in_closet'; end if;
    select * into prod from public.products where id = product_key for share;
    if not found then raise exception 'not_in_closet'; end if;
    tag_id := gen_random_uuid();
    snapshot_value := jsonb_build_object('name',prod.name,'brand',prod.brand,'imagePath',prod.image_path);
   end if;
   insert into public.outfit_explorer_tags(id,image_id,product_id,x,y,snapshot)
    values(tag_id,iid,product_key,(tag->>'x')::float8,(tag->>'y')::float8,snapshot_value)
    on conflict(id) do update set x = excluded.x, y = excluded.y;
   kept_tags := array_append(kept_tags,tag_id);
  end loop;
  pos := pos + 1;
 end loop;
 delete from public.outfit_explorer_tags where image_id in (select id from public.outfit_explorer_images where post_id = pid) and not(id = any(kept_tags));
 delete from public.outfit_explorer_images where post_id = pid and not(id = any(image_ids));
 update public.outfit_explorer_posts set caption = payload->>'caption',status = 'published',updated_at = clock_timestamp(),
  image_path = (select image_path from public.outfit_explorer_images where id = image_ids[1]) where id = pid;
 return pid;
end $$;
revoke all on function public.social_publish_post(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.social_publish_post(uuid,jsonb,boolean) to service_role;

-- Aggregations stay in SQL; feed responses never load every like or follower.
create or replace function public.social_post_stats(ids uuid[], viewer uuid)
 returns table(post_id uuid, likes bigint, liked boolean, saved boolean, image_count bigint)
 language sql stable security invoker set search_path = '' as $$
 select p.id, (select count(*) from public.social_likes l where l.post_id=p.id),
 exists(select 1 from public.social_likes l where l.post_id=p.id and l.user_id=viewer),
 exists(select 1 from public.social_saves s where s.post_id=p.id and s.user_id=viewer),
 (select count(*) from public.outfit_explorer_images i where i.post_id=p.id)
 from public.outfit_explorer_posts p where p.id=any(ids) and p.status='published';
$$;
revoke all on function public.social_post_stats(uuid[],uuid) from public,anon,authenticated;
grant execute on function public.social_post_stats(uuid[],uuid) to service_role;

create or replace function public.social_feed_ids(viewer uuid, mode text, author uuid, before_at timestamptz, before_id uuid)
 returns table(id uuid, sort_at timestamptz) language sql stable security invoker set search_path = '' as $$
 select p.id, case when mode='saved' then s.created_at else p.created_at end as sort_at
 from public.outfit_explorer_posts p
 left join public.social_saves s on mode='saved' and s.post_id=p.id and s.user_id=viewer
 where p.status='published' and (author is null or p.user_id=author)
 and (mode <> 'saved' or s.user_id is not null)
 and (mode <> 'following' or exists(select 1 from public.social_follows f where f.follower_id=viewer and f.following_id=p.user_id))
 and (before_at is null or (case when mode='saved' then s.created_at else p.created_at end,p.id)<(before_at,before_id))
 order by sort_at desc,p.id desc limit 25;
$$;
revoke all on function public.social_feed_ids(uuid,text,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.social_feed_ids(uuid,text,uuid,timestamptz,uuid) to service_role;

create or replace function public.social_discard_upload(actor uuid, upload_id uuid)
 returns void language plpgsql security invoker set search_path = '' as $$
declare item public.social_uploads; begin
 delete from public.social_uploads where id=upload_id and user_id=actor and not used returning * into item;
 if found then insert into public.social_file_cleanup(path) values(item.path) on conflict do nothing; end if;
end $$;
revoke all on function public.social_discard_upload(uuid,uuid) from public,anon,authenticated;
grant execute on function public.social_discard_upload(uuid,uuid) to service_role;
create or replace function public.social_expire_uploads()
 returns void language plpgsql security invoker set search_path = '' as $$
begin
 with expired as (delete from public.social_uploads where not used and created_at < now()-interval '24 hours' returning path)
 insert into public.social_file_cleanup(path) select path from expired on conflict do nothing;
 delete from public.social_uploads where used and created_at < now()-interval '24 hours';
end $$;
revoke all on function public.social_expire_uploads() from public,anon,authenticated;
grant execute on function public.social_expire_uploads() to service_role;
