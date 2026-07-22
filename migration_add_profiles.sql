-- Выполни этот файл в Supabase SQL Editor.
-- Добавляет: профили пользователей (аватар, баннер, описание) и подписки
-- (кто на кого подписан + уведомления о новых публикациях в центр
-- активности).

-- ===================================================================
-- ПРОФИЛИ
-- ===================================================================
-- Одна строка на пользователя (owner_code = тот самый "секретный код"
-- из localStorage, который уже используется как owner_code у фото/видео
-- и как ключ в burunduk_gigers).
create table if not exists burunduk_profiles (
  owner_code text primary key,
  display_name text,
  bio text,
  avatar_path text,   -- путь в сторадже burunduki, как у обычных фото
  banner_path text,   -- путь в сторадже burunduki
  updated_at timestamptz not null default now()
);

alter table burunduk_profiles enable row level security;

create policy "Allow public read burunduk_profiles"
on burunduk_profiles for select
to public
using (true);

create policy "Allow public upsert burunduk_profiles"
on burunduk_profiles for insert
to public
with check (true);

create policy "Allow public update burunduk_profiles"
on burunduk_profiles for update
to public
using (true);

-- ===================================================================
-- ПОДПИСКИ
-- ===================================================================
-- follower_code подписан на target_code. Уникальная пара, чтобы нельзя
-- было подписаться дважды.
create table if not exists burunduk_follows (
  id uuid primary key default gen_random_uuid(),
  follower_code text not null,
  follower_name text,
  target_code text not null,
  created_at timestamptz not null default now(),
  unique (follower_code, target_code)
);

alter table burunduk_follows enable row level security;

create policy "Allow public read burunduk_follows"
on burunduk_follows for select
to public
using (true);

create policy "Allow public insert burunduk_follows"
on burunduk_follows for insert
to public
with check (true);

create policy "Allow public delete burunduk_follows"
on burunduk_follows for delete
to public
using (true);

create index if not exists idx_burunduk_follows_target
on burunduk_follows (target_code);

create index if not exists idx_burunduk_follows_follower
on burunduk_follows (follower_code);

-- ===================================================================
-- Уведомление подписчиков о новой публикации
-- ===================================================================
-- Вызывается сразу после вставки нового фото/видео. Создаёт событие
-- kind='new_post' в ленте активности каждого подписчика автора.
create or replace function notify_followers_new_post(
  p_owner_code text,
  p_owner_name text,
  p_target_type text,
  p_target_id uuid,
  p_target_name text
)
returns void as $$
begin
  insert into burunduk_activity (kind, target_type, target_id, target_name, owner_code, actor_code, actor_name)
  select
    'new_post',
    p_target_type,
    p_target_id,
    p_target_name,
    f.follower_code,   -- получатель уведомления — подписчик
    p_owner_code,       -- кто выложил
    p_owner_name
  from burunduk_follows f
  where f.target_code = p_owner_code;
end;
$$ language plpgsql security definer;

grant execute on function notify_followers_new_post(text, text, text, uuid, text) to anon, authenticated;

-- burunduk_activity.kind уже был ограничен списком ('view','comment','gift'),
-- расширяем список допустимых значений под новый тип события.
alter table burunduk_activity drop constraint if exists burunduk_activity_kind_check;
alter table burunduk_activity add constraint burunduk_activity_kind_check
  check (kind in ('view', 'comment', 'gift', 'new_post', 'follow'));
