create index if not exists service_prayer_timeline_events_church_id_idx
  on public.service_prayer_timeline_events(church_id);

create index if not exists service_liturgy_comments_church_id_idx
  on public.service_liturgy_comments(church_id);

create index if not exists service_liturgy_comments_user_id_idx
  on public.service_liturgy_comments(user_id);
