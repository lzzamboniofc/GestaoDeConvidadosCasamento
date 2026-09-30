-- v1.16: Fotos de cada casamento editáveis pelos próprios noivos.
-- Banco do projeto principal já foi migrado em 2026-09-30; aplicar somente em NOVOS bancos.
-- Observação: default liberado; administrador pode bloquear individualmente.
create table if not exists public.wedding_media_permissions (
 wedding_id uuid primary key references public.weddings(id) on delete cascade,
 couple_can_edit boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.wedding_media_permissions enable row level security;
revoke all on public.wedding_media_permissions from public,anon,authenticated;
grant select,insert,update on public.wedding_media_permissions to authenticated;
create policy "wedding_media_permissions_select" on public.wedding_media_permissions for select to authenticated
using (
 exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin') or
 exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media_permissions.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple')
);
create policy "wedding_media_permissions_admin_insert" on public.wedding_media_permissions for insert to authenticated
with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_media_permissions_admin_update" on public.wedding_media_permissions for update to authenticated
using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'))
with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));

alter table public.wedding_media add column if not exists previous_path text;
alter table public.wedding_media add constraint wedding_media_previous_path_scope check (
 previous_path is null or (
 left(previous_path,length('weddings/'||wedding_id::text||'/'||slot||'/'))=('weddings/'||wedding_id::text||'/'||slot||'/')
 and previous_path ~ '\.(webp|jpg|jpeg|png)$'
 ));
create policy "wedding_media_couple_select" on public.wedding_media for select to authenticated
using (exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple'));
create policy "wedding_media_couple_insert" on public.wedding_media for insert to authenticated
with check (
 exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple')
 and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wedding_media.wedding_id),true)
);
create policy "wedding_media_couple_update" on public.wedding_media for update to authenticated
using (
 exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple')
 and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wedding_media.wedding_id),true)
) with check (
 exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple')
 and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wedding_media.wedding_id),true)
);
create policy "wedding_media_couple_delete" on public.wedding_media for delete to authenticated
using (
 exists(select 1 from public.wedding_members wm where wm.wedding_id=wedding_media.wedding_id and wm.user_id=(select auth.uid()) and wm.access_role='couple')
 and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wedding_media.wedding_id),true)
);
create policy "wedding_private_media_couple_select" on storage.objects for select to authenticated
using (bucket_id='wedding-private-media' and exists(select 1 from public.wedding_members wm
 where wm.wedding_id::text=split_part(name,'/',2) and wm.user_id=(select auth.uid()) and wm.access_role='couple'));
create policy "wedding_private_media_couple_insert" on storage.objects for insert to authenticated
with check (
 bucket_id='wedding-private-media'
 and name ~ '^weddings/[a-f0-9-]{36}/(hero|story|event[01]|schedule|timeline[0-4]|gallery[0-4]|dressCode|rsvp)\.(desktop|mobile)/[a-f0-9-]{36}\.webp$'
 and exists(select 1 from public.wedding_members wm
   where wm.wedding_id::text=split_part(name,'/',2) and wm.user_id=(select auth.uid()) and wm.access_role='couple'
   and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wm.wedding_id),true))
);
create policy "wedding_private_media_couple_delete" on storage.objects for delete to authenticated
using (
 bucket_id='wedding-private-media'
 and exists(select 1 from public.wedding_members wm
   where wm.wedding_id::text=split_part(name,'/',2) and wm.user_id=(select auth.uid()) and wm.access_role='couple'
   and coalesce((select p.couple_can_edit from public.wedding_media_permissions p where p.wedding_id=wm.wedding_id),true))
);
