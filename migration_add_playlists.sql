-- =====================================================================
-- Публичные аудиоплейлисты
-- Выполни в Supabase → SQL Editor после migration_add_audio.sql.
-- Приватные плейлисты остаются только в localStorage браузера.
-- =====================================================================

create table if not exists public.burunduk_playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  owner_code text not null,
  owner_name text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_burunduk_playlists_public_updated
  on public.burunduk_playlists (is_public, updated_at desc);
create index if not exists idx_burunduk_playlists_owner
  on public.burunduk_playlists (owner_code, updated_at desc);

create table if not exists public.burunduk_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.burunduk_playlists(id) on delete cascade,
  audio_id uuid not null references public.burunduk_audio(id) on delete cascade,
  -- NULL означает основную авторскую дорожку. UUID дополнительной дорожки
  -- хранится без FK, чтобы миграция не зависела от порядка установки
  -- migration_add_audio_voice_tracks.sql.
  voice_track_id uuid,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_burunduk_playlist_items_order
  on public.burunduk_playlist_items (playlist_id, position, created_at);
create index if not exists idx_burunduk_playlist_items_audio
  on public.burunduk_playlist_items (audio_id);

alter table public.burunduk_playlists enable row level security;
alter table public.burunduk_playlist_items enable row level security;

grant select, insert, update, delete on public.burunduk_playlists to anon, authenticated;
grant select, insert, update, delete on public.burunduk_playlist_items to anon, authenticated;

drop policy if exists "Public playlists are readable" on public.burunduk_playlists;
create policy "Public playlists are readable"
  on public.burunduk_playlists for select to anon, authenticated
  using (is_public = true);

drop policy if exists "Public playlists can be created" on public.burunduk_playlists;
create policy "Public playlists can be created"
  on public.burunduk_playlists for insert to anon, authenticated
  with check (is_public = true);

drop policy if exists "Public playlists can be updated" on public.burunduk_playlists;
create policy "Public playlists can be updated"
  on public.burunduk_playlists for update to anon, authenticated
  using (is_public = true)
  with check (is_public = true);

drop policy if exists "Public playlists can be deleted" on public.burunduk_playlists;
create policy "Public playlists can be deleted"
  on public.burunduk_playlists for delete to anon, authenticated
  using (is_public = true);

drop policy if exists "Items of public playlists are readable" on public.burunduk_playlist_items;
create policy "Items of public playlists are readable"
  on public.burunduk_playlist_items for select to anon, authenticated
  using (exists (
    select 1 from public.burunduk_playlists p
    where p.id = playlist_id and p.is_public = true
  ));

drop policy if exists "Items can be added to public playlists" on public.burunduk_playlist_items;
create policy "Items can be added to public playlists"
  on public.burunduk_playlist_items for insert to anon, authenticated
  with check (exists (
    select 1 from public.burunduk_playlists p
    where p.id = playlist_id and p.is_public = true
  ));

drop policy if exists "Items can be updated in public playlists" on public.burunduk_playlist_items;
create policy "Items can be updated in public playlists"
  on public.burunduk_playlist_items for update to anon, authenticated
  using (exists (
    select 1 from public.burunduk_playlists p
    where p.id = playlist_id and p.is_public = true
  ))
  with check (exists (
    select 1 from public.burunduk_playlists p
    where p.id = playlist_id and p.is_public = true
  ));

drop policy if exists "Items can be removed from public playlists" on public.burunduk_playlist_items;
create policy "Items can be removed from public playlists"
  on public.burunduk_playlist_items for delete to anon, authenticated
  using (exists (
    select 1 from public.burunduk_playlists p
    where p.id = playlist_id and p.is_public = true
  ));
