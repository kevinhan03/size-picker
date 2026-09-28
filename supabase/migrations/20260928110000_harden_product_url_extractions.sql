-- These tables are internal server caches. Keep explicit deny policies so the
-- Data API has no accidental client path even if grants change in the future.
create policy "deny direct product extraction cache access"
on public.product_url_extractions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny direct product extraction limit access"
on public.product_extraction_limits
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
