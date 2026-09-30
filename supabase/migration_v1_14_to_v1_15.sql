-- v1.15 — Biblioteca de fotos e mídias individuais por casamento.
-- JÁ APLICADO no Supabase do projeto oblucxwvsouyjhfqaten em 2026-09-30.
-- Para outro projeto Supabase, aplique somente uma vez, depois de schema.sql e demais migrations.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
 ('wedding-demo-media','wedding-demo-media',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('wedding-private-media','wedding-private-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create table if not exists public.wedding_media (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 slot text not null,
 path text not null,
 updated_at timestamptz not null default now(),
 primary key (wedding_id, slot),
 constraint wedding_media_allowed_slot check (slot ~ '^(hero|story|event[01]|schedule|timeline[0-4]|gallery[0-4]|dressCode|rsvp)\.(desktop|mobile)$'),
 constraint wedding_media_path_scope check (left(path,length('weddings/' || wedding_id::text || '/' || slot || '/')) = ('weddings/' || wedding_id::text || '/' || slot || '/')),
 constraint wedding_media_file_extension check (path ~ '\.(webp|jpg|jpeg|png)$')
);
alter table public.wedding_media enable row level security;
revoke all on public.wedding_media from anon,authenticated;
grant select,insert,update,delete on public.wedding_media to authenticated;

create policy "wedding_media_admin_select" on public.wedding_media for select to authenticated
 using (exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role='admin'));
create policy "wedding_media_admin_insert" on public.wedding_media for insert to authenticated
 with check (exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role='admin'));
create policy "wedding_media_admin_update" on public.wedding_media for update to authenticated
 using (exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role='admin'))
 with check (exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role='admin'));
create policy "wedding_media_admin_delete" on public.wedding_media for delete to authenticated
 using (exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role='admin'));

create policy "wedding_private_media_admin_select" on storage.objects for select to authenticated
 using (bucket_id='wedding-private-media' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_private_media_admin_insert" on storage.objects for insert to authenticated
 with check (bucket_id='wedding-private-media' and name like 'weddings/%' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_private_media_admin_update" on storage.objects for update to authenticated
 using (bucket_id='wedding-private-media' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'))
 with check (bucket_id='wedding-private-media' and name like 'weddings/%' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_private_media_admin_delete" on storage.objects for delete to authenticated
 using (bucket_id='wedding-private-media' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));

create policy "wedding_demo_media_admin_select" on storage.objects for select to authenticated
 using (bucket_id='wedding-demo-media' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_demo_media_admin_insert" on storage.objects for insert to authenticated
 with check (bucket_id='wedding-demo-media' and name like 'nivel-3/%' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "wedding_demo_media_admin_update" on storage.objects for update to authenticated
 using (bucket_id='wedding-demo-media' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'))
 with check (bucket_id='wedding-demo-media' and name like 'nivel-3/%' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
