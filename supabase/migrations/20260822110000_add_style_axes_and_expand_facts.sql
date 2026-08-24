alter table public.products
  add column if not exists style_axes jsonb,
  add column if not exists human_style_axes jsonb,
  add column if not exists style_axis_analysis_status text not null default 'pending',
  add column if not exists style_axis_analysis_error text,
  add column if not exists style_axis_analyzed_at timestamptz;

alter table public.products drop constraint if exists products_style_axis_analysis_status_check;
alter table public.products add constraint products_style_axis_analysis_status_check
  check (style_axis_analysis_status in ('pending', 'tagging', 'tagged', 'failed'));

-- Preserve the meaning of the former one-of surface_texture value while moving
-- to independently stored finish, character, and treatment facts.
with mapped as (
  select id,
    case when style_attributes ? 'surface_texture' then style_attributes - 'surface_texture' else style_attributes end as ai_base,
    case when human_style_attributes ? 'surface_texture' then human_style_attributes - 'surface_texture' else human_style_attributes end as human_base,
    style_attributes ->> 'surface_texture' as ai_surface,
    human_style_attributes ->> 'surface_texture' as human_surface
  from public.products
)
update public.products p
set style_attributes = case
      when mapped.ai_surface is null then p.style_attributes
      else mapped.ai_base || case
        when mapped.ai_surface in ('clean', 'washed', 'faded', 'distressed') then jsonb_build_object('surface_treatment', mapped.ai_surface)
        when mapped.ai_surface in ('matte', 'glossy') then jsonb_build_object('surface_finish', mapped.ai_surface)
        when mapped.ai_surface in ('textured', 'quilted', 'brushed', 'sheer') then jsonb_build_object('surface_character', mapped.ai_surface)
        else '{}'::jsonb end
    end,
    human_style_attributes = case
      when mapped.human_surface is null then p.human_style_attributes
      else mapped.human_base || case
        when mapped.human_surface in ('clean', 'washed', 'faded', 'distressed') then jsonb_build_object('surface_treatment', mapped.human_surface)
        when mapped.human_surface in ('matte', 'glossy') then jsonb_build_object('surface_finish', mapped.human_surface)
        when mapped.human_surface in ('textured', 'quilted', 'brushed', 'sheer') then jsonb_build_object('surface_character', mapped.human_surface)
        else '{}'::jsonb end
    end
from mapped
where p.id = mapped.id and (mapped.ai_surface is not null or mapped.human_surface is not null);

-- Convert the four former ordered review attributes into their corresponding
-- new axes without fabricating values for the two genuinely new axes.
update public.products
set human_style_axes = coalesce(human_style_axes, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
  'formality', case human_style_attributes ->> 'formality'
    when 'casual' then 2 when 'smart' then 4 when 'formal' then 5 else null end,
  'structure', case human_style_attributes ->> 'structure'
    when 'soft' then 2 when 'balanced' then 3 when 'structured' then 4 else null end,
  'visual_complexity', case human_style_attributes ->> 'decoration'
    when 'minimal' then 1 when 'moderate' then 3 when 'statement' then 5 else null end,
  'functional_technicality', case human_style_attributes ->> 'utility'
    when 'none' then 1 when 'light' then 2 when 'strong' then 4 else null end
))
where human_style_attributes is not null;

-- These four legacy values now live in human_style_axes.  Remove them from
-- the facts object so the expanded fact validator only sees factual fields.
update public.products
set style_attributes = style_attributes - array['formality', 'structure', 'utility', 'decoration'],
    human_style_attributes = human_style_attributes - array['formality', 'structure', 'utility', 'decoration']
where style_attributes ?| array['formality', 'structure', 'utility', 'decoration']
   or human_style_attributes ?| array['formality', 'structure', 'utility', 'decoration'];

drop function if exists public.get_closet_products(uuid);
drop function if exists public.get_digbox_products(uuid);

create function public.get_closet_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, url text, image_path text,
  slug text, created_at timestamptz, is_instagram boolean, instagram_order integer,
  target_gender text, human_target_gender text,
  style_tags jsonb, style_attributes jsonb, style_axes jsonb,
  human_style_tags jsonb, human_style_attributes jsonb, human_style_axes jsonb,
  tag_review_status text, added_at timestamptz,
  selected_size_label text, selected_size_row_index integer, selected_size_snapshot jsonb
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender, p.human_target_gender,
    p.style_tags, p.style_attributes, p.style_axes,
    p.human_style_tags, p.human_style_attributes, p.human_style_axes,
    p.tag_review_status, item.added_at, item.selected_size_label, item.selected_size_row_index, item.selected_size_snapshot
  from public.user_closet_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

create function public.get_digbox_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, url text, image_path text,
  slug text, created_at timestamptz, is_instagram boolean, instagram_order integer,
  target_gender text, human_target_gender text,
  style_tags jsonb, style_attributes jsonb, style_axes jsonb,
  human_style_tags jsonb, human_style_attributes jsonb, human_style_axes jsonb,
  tag_review_status text, registered_by text, added_at timestamptz, discovered_save_count bigint,
  size_decision_label text, size_decision_row_index integer, size_decision_snapshot jsonb,
  size_decision_sources text[], size_decision_fit text, size_decision_note text, size_decision_updated_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender, p.human_target_gender,
    p.style_tags, p.style_attributes, p.style_axes,
    p.human_style_tags, p.human_style_attributes, p.human_style_axes,
    p.tag_review_status, p.registered_by, item.added_at,
    case when owner.username is not null and p.registered_by = owner.username then
      greatest(0::bigint, coalesce(saves.save_count, 0::bigint) - 1) else 0::bigint end,
    item.size_decision_label, item.size_decision_row_index, item.size_decision_snapshot,
    item.size_decision_sources, item.size_decision_fit, item.size_decision_note, item.size_decision_updated_at
  from public.user_digbox_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  left join public.users owner on owner.id = item.user_id
  left join (
    select saved.product_id, count(distinct saved.user_id)::bigint as save_count
    from public.user_digbox_items saved group by saved.product_id
  ) saves on saves.product_id = item.product_id
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

revoke all on function public.get_closet_products(uuid) from public, anon, authenticated;
revoke all on function public.get_digbox_products(uuid) from public, anon, authenticated;
grant execute on function public.get_closet_products(uuid) to service_role;
grant execute on function public.get_digbox_products(uuid) to service_role;
