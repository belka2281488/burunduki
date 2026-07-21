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
