create or replace function public.set_post_like(p_post_id uuid, p_is_liked boolean)
returns table(likes_count integer, liked_by jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := (select auth.uid());
begin
  if viewer_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  with next_value as (
    select
      p.id,
      case
        when p_is_liked and not (coalesce(p.liked_by, '[]'::jsonb) ? viewer_id::text)
          then coalesce(p.liked_by, '[]'::jsonb) || jsonb_build_array(viewer_id::text)
        when not p_is_liked
          then coalesce((
            select jsonb_agg(item.value)
            from jsonb_array_elements(coalesce(p.liked_by, '[]'::jsonb)) as item(value)
            where item.value <> to_jsonb(viewer_id::text)
          ), '[]'::jsonb)
        else coalesce(p.liked_by, '[]'::jsonb)
      end as next_liked_by
    from public.posts p
    where p.id = p_post_id
  ),
  applied as (
    update public.posts p
    set liked_by = n.next_liked_by,
        likes_count = jsonb_array_length(n.next_liked_by)
    from next_value n
    where p.id = n.id
    returning p.likes_count, p.liked_by
  )
  select applied.likes_count, applied.liked_by
  from applied;
end;
$$;

revoke all on function public.set_post_like(uuid, boolean) from public, anon;
grant execute on function public.set_post_like(uuid, boolean) to authenticated;
