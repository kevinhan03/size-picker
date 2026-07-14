create index outfit_requests_accepted_proposal_idx
  on public.outfit_requests(accepted_proposal_id)
  where accepted_proposal_id is not null;

create policy "deny direct outfit request access"
  on public.outfit_requests for all to anon, authenticated
  using (false) with check (false);

create policy "deny direct outfit request item access"
  on public.outfit_request_items for all to anon, authenticated
  using (false) with check (false);

create policy "deny direct outfit proposal access"
  on public.outfit_proposals for all to anon, authenticated
  using (false) with check (false);

create policy "deny direct outfit proposal item access"
  on public.outfit_proposal_items for all to anon, authenticated
  using (false) with check (false);
