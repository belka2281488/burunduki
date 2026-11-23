-- =====================================================================
-- Аудио: разрешить оценки, комментарии и подарки гиперзадок для target_type='audio'.
-- Выполнить один раз в Supabase → SQL Editor после базовых миграций проекта.
-- Таблицы и RPC-функции не пересоздаются; меняются только CHECK-ограничения.
-- =====================================================================

begin;

alter table public.burunduk_comments
  drop constraint if exists burunduk_comments_target_type_check;
alter table public.burunduk_comments
  add constraint burunduk_comments_target_type_check
  check (target_type in ('photo', 'video', 'text', 'audio'));

alter table public.burunduk_ratings
  drop constraint if exists burunduk_ratings_target_type_check;
alter table public.burunduk_ratings
  add constraint burunduk_ratings_target_type_check
  check (target_type in ('photo', 'video', 'text', 'audio'));

alter table public.burunduk_giger_gifts
  drop constraint if exists burunduk_giger_gifts_target_type_check;
alter table public.burunduk_giger_gifts
  add constraint burunduk_giger_gifts_target_type_check
  check (target_type in ('photo', 'video', 'text', 'audio'));

alter table public.burunduk_activity
  drop constraint if exists burunduk_activity_target_type_check;
alter table public.burunduk_activity
  add constraint burunduk_activity_target_type_check
  check (target_type in ('photo', 'video', 'text', 'audio', 'profile'));

commit;
