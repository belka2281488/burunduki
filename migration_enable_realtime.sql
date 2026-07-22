-- Включаем Supabase Realtime для таблиц, за которыми теперь следит сайт
-- (уведомления в колокольчике, новые посты, новые комментарии — без перезагрузки страницы).
--
-- Как применить:
-- 1. Открой свой проект на supabase.com -> SQL Editor -> New query.
-- 2. Вставь весь этот файл и нажми Run.
-- 3. Готово — обновлять код в config.js не нужно, всё уже работает через тот же анонимный ключ.
--
-- Если какая-то из команд ниже выдаст ошибку "already exists"/"is already a member" —
-- это нормально, значит таблица уже была добавлена раньше, просто пропусти эту строку.

alter publication supabase_realtime add table public.burunduk_activity;
alter publication supabase_realtime add table public.burunduki;
alter publication supabase_realtime add table public.burunduki_videos;
alter publication supabase_realtime add table public.burunduk_ratings;
