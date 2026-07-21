-- Выполни в Supabase SQL Editor ПОСЛЕ migration_add_categories.sql
-- Добавляет разделы (категории) и для видео тоже.

alter table burunduki_videos
  add column if not exists category_id uuid references burunduk_categories(id);

update burunduki_videos
set category_id = (select id from burunduk_categories where name = 'Бурундуки')
where category_id is null;
