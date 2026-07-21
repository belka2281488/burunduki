-- Выполни этот файл в Supabase, если у тебя УЖЕ есть таблицы
-- burunduki и burunduki_videos (созданные раньше через setup.sql
-- или migration_add_videos.sql).
--
-- Он добавляет поля "владелец" — имя того, кто добавил, и секретный
-- код, чтобы только он (точнее, только его браузер) мог редактировать
-- или удалять эту запись.

alter table burunduki
  add column if not exists owner_name text,
  add column if not exists owner_code text;

alter table burunduki_videos
  add column if not exists owner_name text,
  add column if not exists owner_code text;

-- Старые записи (загруженные до этого обновления) останутся без
-- владельца — их сможет редактировать кто угодно, это нормально,
-- считай их "общими". Новые записи уже будут привязаны к автору.
