-- v1.11: configurações opcionais do convite por casamento (aplica-se após v1.10)
-- Isoladas de dados administrativos; convidado só obtém versão filtrada via token na Edge Function.
create table if not exists public.wedding_customizations (
  wedding_id uuid primary key references public.weddings(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint customization_object check (jsonb_typeof(settings) = 'object'),
  constraint customization_size check (octet_length(settings::text) <= 30000)
);
create or replace function public.touch_wedding_customization()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists touch_wedding_customization on public.wedding_customizations;
create trigger touch_wedding_customization before update on public.wedding_customizations
for each row execute function public.touch_wedding_customization();

alter table public.wedding_customizations enable row level security;
revoke all on public.wedding_customizations from public, anon, authenticated;
grant select, insert, update on public.wedding_customizations to authenticated;

drop policy if exists "wedding_customizations_read" on public.wedding_customizations;
create policy "wedding_customizations_read" on public.wedding_customizations for select to authenticated
using (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = (select auth.uid()))
  or exists (select 1 from public.wedding_members wm where wm.wedding_id = wedding_id and wm.user_id = (select auth.uid()))
);
drop policy if exists "wedding_customizations_insert" on public.wedding_customizations;
create policy "wedding_customizations_insert" on public.wedding_customizations for insert to authenticated
with check (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = (select auth.uid()))
  or exists (select 1 from public.wedding_members wm where wm.wedding_id = wedding_id and wm.user_id = (select auth.uid()))
);
drop policy if exists "wedding_customizations_update" on public.wedding_customizations;
create policy "wedding_customizations_update" on public.wedding_customizations for update to authenticated
using (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = (select auth.uid()))
  or exists (select 1 from public.wedding_members wm where wm.wedding_id = wedding_id and wm.user_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = (select auth.uid()))
  or exists (select 1 from public.wedding_members wm where wm.wedding_id = wedding_id and wm.user_id = (select auth.uid()))
);
