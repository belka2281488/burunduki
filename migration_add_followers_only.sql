-- Выполни в Supabase SQL Editor.
-- Добавляет флаг "только для подписчиков" к фото и видео.
-- По умолчанию false (публикация видна всем, как раньше).

alter table burunduki add column if not exists followers_only boolean not null default false;
alter table burunduki_videos add column if not exists followers_only boolean not null default false;
