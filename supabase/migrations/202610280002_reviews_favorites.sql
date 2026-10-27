-- Phase 4 additive migration. Review locally; apply to Supabase only after approval.
-- No existing user content, RLS policy, rating view or tag definition is changed.
begin;

-- Allows a client-generated UUID to identify one submission across network retries.
-- Existing owner INSERT RLS still applies; UPDATE(id) remains ungranted/immutable.
grant insert (id) on public.reviews to authenticated;

create function public.save_review(
  p_id uuid,
  p_restaurant_id text,
  p_rating integer,
  p_body text,
  p_tag_ids bigint[],
  p_creating boolean
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  existing public.reviews%rowtype;
  tags bigint[] := coalesce(p_tag_ids, array[]::bigint[]);
begin
  if caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_id is null or p_creating is null or p_restaurant_id is null
    or p_rating is null or p_rating not between 1 and 5
    or p_body is null or char_length(btrim(p_body)) not between 1 and 5000
    or p_body !~ '[^[:space:]]'
    or cardinality(tags) > 10 then
    raise exception 'Invalid review input' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(tags) as requested(id)
    where requested.id is null or not exists (
      select 1 from public.review_tags actual where actual.id = requested.id
    )
  ) then
    raise exception 'Unknown review tag' using errcode = '22023';
  end if;

  -- Serialize the same submission, including two first requests before a row exists.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text, 0));
  select * into existing from public.reviews where id = p_id for update;
  if found then
    if existing.user_id <> caller or existing.restaurant_id <> p_restaurant_id then
      raise exception 'Review ownership mismatch' using errcode = '42501';
    end if;
    if p_creating then
      -- A repeated creation never changes an already accepted review or its tags.
      return existing.id;
    end if;
    update public.reviews set rating = p_rating, body = btrim(p_body)
      where id = p_id and user_id = caller;
  else
    if not p_creating then
      raise exception 'Review not found' using errcode = 'P0002';
    end if;
    insert into public.reviews(id, restaurant_id, user_id, rating, body)
      values(p_id, p_restaurant_id, caller, p_rating, btrim(p_body));
  end if;

  -- An RPC is one transaction: any FK/RLS/tag failure rolls back review and links.
  delete from public.review_tag_links where review_id = p_id;
  insert into public.review_tag_links(review_id, tag_id)
    select p_id, requested.id from (select distinct unnest(tags) as id) requested;
  return p_id;
end;
$$;

revoke all on function public.save_review(uuid, text, integer, text, bigint[], boolean)
  from public, anon, authenticated;
grant execute on function public.save_review(uuid, text, integer, text, bigint[], boolean)
  to authenticated;

-- INTENTIONAL PUBLIC PROJECTION, requiring explicit approval before deployment:
-- default view-owner permissions read profiles despite its owner-only SELECT RLS.
-- Only authors of existing public reviews are projected, only review ID + nickname.
-- No profile ID, email, avatar, metadata or arbitrary profile lookup is exposed.
-- Base profiles RLS/grants remain unchanged. Do not add private columns here.
-- Current reviews are public by policy; revisit this projection if that changes.
create view public.review_author_names with (security_barrier = true) as
select r.id as review_id, p.display_name
from public.reviews r
left join public.profiles p on p.id = r.user_id;

revoke all on public.review_author_names from public, anon, authenticated;
grant select on public.review_author_names to anon, authenticated;

commit;
