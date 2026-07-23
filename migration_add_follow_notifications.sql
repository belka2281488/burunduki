-- Выполни этот файл в Supabase SQL Editor.
-- Добавляет уведомление о подписке в центр активности ("X подписался
-- на тебя"). Раньше события 'follow' в списке допустимых kind уже были
-- предусмотрены (см. migration_add_profiles.sql), но у события "подписка"
-- нет привязки к конкретному фото/видео, поэтому:
--  - target_id должен разрешать NULL;
--  - target_type должен разрешать значение 'profile' (не только photo/video).

alter table burunduk_activity alter column target_id drop not null;

alter table burunduk_activity drop constraint if exists burunduk_activity_target_type_check;
alter table burunduk_activity add constraint burunduk_activity_target_type_check
  check (target_type in ('photo', 'video', 'profile'));

-- На всякий случай ещё раз убеждаемся, что 'follow' разрешён в kind
-- (если по какой-то причине migration_add_profiles.sql не применялась).
alter table burunduk_activity drop constraint if exists burunduk_activity_kind_check;
alter table burunduk_activity add constraint burunduk_activity_kind_check
  check (kind in ('view', 'comment', 'gift', 'new_post', 'follow'));
