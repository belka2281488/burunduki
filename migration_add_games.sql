-- ==============================================
-- Запусти в Supabase SQL Editor
-- ==============================================

-- 1. Таблица игр (убираем старые лишние колонки если есть)
alter table burunduk_games drop column if exists drive_url;
alter table burunduk_games drop column if exists version;
alter table burunduk_games drop column if exists platform;

create table if not exists burunduk_games (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  author      text,
  owner_code  text,
  owner_name  text,
  icon_url    text,
  created_at  timestamptz default now()
);

-- 2. Версии
create table if not exists burunduk_game_versions (
  id         bigint generated always as identity primary key,
  game_id    bigint not null references burunduk_games(id) on delete cascade,
  drive_url  text not null,
  note       text,
  created_at timestamptz default now()
);

-- 3. Теги
create table if not exists burunduk_game_tags (
  id      bigint generated always as identity primary key,
  game_id bigint not null references burunduk_games(id) on delete cascade,
  tag     text not null
);

-- 4. Скачивания
create table if not exists burunduk_game_downloads (
  id         bigint generated always as identity primary key,
  game_id    bigint not null references burunduk_games(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. Комментарии
create table if not exists burunduk_game_comments (
  id          bigint generated always as identity primary key,
  game_id     bigint not null references burunduk_games(id) on delete cascade,
  text        text not null,
  author_name text,
  author_code text,
  reply_to_id bigint references burunduk_game_comments(id) on delete set null,
  edited_at   timestamptz,
  created_at  timestamptz default now()
);

-- 6. RLS для всех таблиц
alter table burunduk_games           enable row level security;
alter table burunduk_game_versions   enable row level security;
alter table burunduk_game_tags       enable row level security;
alter table burunduk_game_downloads  enable row level security;
alter table burunduk_game_comments   enable row level security;

-- drop старых политик если есть
drop policy if exists "games_read"        on burunduk_games;
drop policy if exists "games_insert"      on burunduk_games;
drop policy if exists "games_delete"      on burunduk_games;
drop policy if exists "versions_read"     on burunduk_game_versions;
drop policy if exists "versions_insert"   on burunduk_game_versions;
drop policy if exists "versions_delete"   on burunduk_game_versions;

-- burunduk_games
create policy "games_read"   on burunduk_games for select using (true);
create policy "games_insert" on burunduk_games for insert with check (true);
create policy "games_delete" on burunduk_games for delete using (true);
create policy "games_update" on burunduk_games for update using (true);

-- versions
create policy "gver_read"   on burunduk_game_versions for select using (true);
create policy "gver_insert" on burunduk_game_versions for insert with check (true);
create policy "gver_delete" on burunduk_game_versions for delete using (true);

-- tags
create policy "gtag_read"   on burunduk_game_tags for select using (true);
create policy "gtag_insert" on burunduk_game_tags for insert with check (true);
create policy "gtag_delete" on burunduk_game_tags for delete using (true);

-- downloads
create policy "gdl_read"   on burunduk_game_downloads for select using (true);
create policy "gdl_insert" on burunduk_game_downloads for insert with check (true);
create policy "gdl_delete" on burunduk_game_downloads for delete using (true);

-- comments
create policy "gcom_read"   on burunduk_game_comments for select using (true);
create policy "gcom_insert" on burunduk_game_comments for insert with check (true);
create policy "gcom_delete" on burunduk_game_comments for delete using (true);

create policy "gcom_update" on burunduk_game_comments for update using (true) with check (true);


-- Ответы на игровые комментарии.
alter table burunduk_game_comments
  add column if not exists reply_to_id bigint references burunduk_game_comments(id) on delete set null;

create index if not exists idx_burunduk_game_comments_reply
  on burunduk_game_comments (reply_to_id);
