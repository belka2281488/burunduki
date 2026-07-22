-- Выполни этот файл в Supabase, ЕСЛИ у тебя уже есть основные таблицы
-- (burunduki, burunduki_videos, burunduk_ratings, burunduk_gigers,
-- burunduk_giger_gifts, burunduk_activity).
--
-- Раньше комментарий был жёстко привязан к оценке (1 комментарий на
-- человека на карточку, только вместе со звёздами). Эта миграция
-- добавляет отдельную ленту комментариев:
--  - можно комментировать без оценки;
--  - можно оставить сколько угодно комментариев подряд;
--  - можно ответить на конкретный комментарий (reply_to_id);
--  - гиперзадку теперь можно подарить прямо вместе с комментарием,
--    тоже без обязательной оценки.
--
-- Старые комментарии, которые лежали в burunduk_ratings.comment,
-- никуда не делись — сама оценка (звёзды) продолжает работать как
-- раньше, просто её поле comment больше не используется на фронте.

create table if not exists burunduk_comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  owner_code text, -- владелец карточки (кому упадёт уведомление в центр активности)
  author_code text not null,
  author_name text,
  text text not null,
  reply_to_id uuid references burunduk_comments (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table burunduk_comments enable row level security;

create policy "Allow public read burunduk_comments"
on burunduk_comments for select
to public
using (true);

create policy "Allow public insert burunduk_comments"
on burunduk_comments for insert
to public
with check (true);

-- Разрешаем автору удалять/редактировать свои комментарии с фронта
-- (сравнение идёт по author_code, который хранится в localStorage
-- пользователя — тот же принцип, что и в остальных таблицах проекта).
create policy "Allow public update burunduk_comments"
on burunduk_comments for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduk_comments"
on burunduk_comments for delete
to public
using (true);

create index if not exists idx_burunduk_comments_target
on burunduk_comments (target_type, target_id, created_at);

create index if not exists idx_burunduk_comments_reply
on burunduk_comments (reply_to_id);

-- Не забудь также сделать live-обновление комментариев в реальном
-- времени — добавь таблицу в публикацию Realtime (если ещё не делал
-- этого для остальных таблиц миграцией migration_enable_realtime.sql):
alter publication supabase_realtime add table public.burunduk_comments;
