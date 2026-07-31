alter table public.service_reactions
  drop constraint if exists service_reactions_service_id_user_id_reaction_type_key;

create index if not exists service_reactions_service_created_at_idx
  on public.service_reactions(service_id, created_at desc);
