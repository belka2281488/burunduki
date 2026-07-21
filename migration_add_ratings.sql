-- Выполни этот файл в Supabase, ЕСЛИ у тебя уже есть таблицы
-- burunduki и burunduki_videos (созданные раньше через setup.sql).
-- Он добавляет новую таблицу для системы оценок ("ранг бурундука"
-- от 1 до 7 вместо звёзд), старые таблицы не трогает.

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

-- Уникальность (target_type, target_id, rater_code) означает: один и
-- тот же человек (браузер) может поставить только одну оценку одному
-- фото/видео — если оценивает второй раз, старая оценка обновляется
-- (это делает сайт через upsert), а не создаётся вторая запись.
