-- A tagged product may come from either the user's Closet or saved Digbox.
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
    perform 1 from public.user_closet_items
      where user_id = owner_id and product_id = product_key::text for share;
    if not found then
      perform 1 from public.user_digbox_items
        where user_id = owner_id and product_id = product_key::text for share;
    end if;
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
