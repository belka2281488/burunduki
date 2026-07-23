-- Выполни этот файл в Supabase SQL Editor.
-- Добавляет "закреп" — публикацию можно закрепить в своём профиле,
-- она всегда будет показываться первой (как закреп в соцсетях).

alter table burunduki add column if not exists pinned boolean not null default false;
alter table burunduki_videos add column if not exists pinned boolean not null default false;
