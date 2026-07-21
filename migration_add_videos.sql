-- Выполни этот файл, ЕСЛИ ты уже раньше выполнял setup.sql
-- и таблица burunduki у тебя уже есть.
-- Этот файл только добавляет новую таблицу для видео, старое не трогает.

create table if not exists burunduki_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  source text not null default 'other', -- google_drive | youtube | tiktok | tenor | other
  name text not null,
  description text,
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
