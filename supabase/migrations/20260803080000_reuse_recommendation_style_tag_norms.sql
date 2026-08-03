do $migration$
declare
  definition text;
begin
  select pg_get_functiondef('public.get_product_recommendation_candidates_v2(bigint,integer,integer)'::regprocedure)
    into definition;

  definition := replace(
    definition,
    $old$  ), candidates as ($old$,
    $new$  ), source_with_style_norm as (
    select
      source.*,
      style_norm.norm as style_norm
    from source
    cross join lateral (
      select coalesce(sqrt(sum(power(entry.value::double precision, 2))), 0) as norm
      from jsonb_each_text(source.effective_style_tags) entry
      where entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
    ) style_norm
  ), candidates as ($new$
  );
  definition := replace(definition, E'    from source\n', E'    from source_with_style_norm source\n');
  definition := replace(
    definition,
    $old$    cross join lateral (
      select case when source_norm.norm = 0 or candidate_norm.norm = 0 then null
        else coalesce(dot_product.value, 0) / (source_norm.norm * candidate_norm.norm)
      end as style_similarity
      from lateral (
        select coalesce(sqrt(sum(power(entry.value::double precision, 2))), 0) as norm
        from jsonb_each_text(source.effective_style_tags) entry
        where entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
      ) source_norm
      cross join lateral (
        select coalesce(sqrt(sum(power(entry.value::double precision, 2))), 0) as norm
        from jsonb_each_text(candidate.effective_style_tags) entry
        where entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
      ) candidate_norm
      cross join lateral (
        select sum(source_entry.value::double precision * candidate_entry.value::double precision) as value
        from jsonb_each_text(source.effective_style_tags) source_entry
        join jsonb_each_text(candidate.effective_style_tags) candidate_entry using (key)
        where source_entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
          and candidate_entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
      ) dot_product
    ) metrics$old$,
    $new$    cross join lateral (
      select
        coalesce(sqrt(sum(power(candidate_entry.value::double precision, 2))), 0) as candidate_norm,
        coalesce(sum(
          case when source_entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
            then source_entry.value::double precision * candidate_entry.value::double precision
            else 0
          end
        ), 0) as dot_product
      from jsonb_each_text(candidate.effective_style_tags) candidate_entry
      left join jsonb_each_text(source.effective_style_tags) source_entry on source_entry.key = candidate_entry.key
      where candidate_entry.value ~ E'^[0-9]+(\\.[0-9]+)?$'
    ) tag_metrics
    cross join lateral (
      select case when source.style_norm = 0 or tag_metrics.candidate_norm = 0 then null
        else tag_metrics.dot_product / (source.style_norm * tag_metrics.candidate_norm)
      end as style_similarity
    ) metrics$new$
  );

  execute definition;
end
$migration$;
