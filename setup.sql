-- Выполни этот файл целиком в Supabase: SQL Editor -> New query -> вставь -> Run
-- Это для НОВОГО проекта, где ещё нет таблиц burunduki / burunduki_videos.
-- Если у тебя они уже есть — используй migration_add_owner.sql вместо этого файла.

-- Таблица с информацией о бурундуках (имя, описание, ссылка на файл)
create table if not exists burunduki (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  name text not null,
  description text,
  owner_name text,
  owner_code text,
  created_at timestamptz not null default now()
);

alter table burunduki enable row level security;

create policy "Allow public read burunduki"
on burunduki for select
to public
using (true);

create policy "Allow public insert burunduki"
on burunduki for insert
to public
with check (true);

create policy "Allow public update burunduki"
on burunduki for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduki"
on burunduki for delete
to public
using (true);


-- ===================================================================
-- Таблица для видео (ссылки на Google Drive, YouTube, TikTok, Tenor)
-- ===================================================================
create table if not exists burunduki_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  source text not null default 'other',
  name text not null,
  description text,
  owner_name text,
  owner_code text,
  created_at timestamptz not null default now()
);

alter table burunduki_videos enable row level security;

create policy "Allow public read burunduki_videos"
on burunduki_videos for select
to public
using (true);

create policy "Allow public insert burunduki_videos"
on burunduki_videos for insert
to public
with check (true);

create policy "Allow public update burunduki_videos"
on burunduki_videos for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduki_videos"
on burunduki_videos for delete
to public
using (true);


-- ===================================================================
-- Таблица оценок ("ранг бурундука" от 1 до 7 вместо звёзд)
-- ===================================================================
create table if not exists burunduk_ratings (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  rank smallint not null check (rank between 1 and 7),
  comment text,
  rater_name text,
  rater_code text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, rater_code)
);

alter table burunduk_ratings enable row level security;

create policy "Allow public read burunduk_ratings"
on burunduk_ratings for select
to public
using (true);

create policy "Allow public insert burunduk_ratings"
on burunduk_ratings for insert
to public
with check (true);

create policy "Allow public update burunduk_ratings"
on burunduk_ratings for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduk_ratings"
on burunduk_ratings for delete
to public
using (true);
