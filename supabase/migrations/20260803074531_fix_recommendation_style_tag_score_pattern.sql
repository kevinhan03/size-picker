do $migration$
declare
  definition text;
begin
  select pg_get_functiondef('public.get_product_recommendation_candidates_v2(bigint,integer,integer)'::regprocedure)
    into definition;
  definition := replace(
    definition,
    $pattern$'^[0-9]+(\\.[0-9]+)?$'$pattern$,
    $replacement$E'^[0-9]+(\\.[0-9]+)?$'$replacement$
  );
  execute definition;
end
$migration$;
