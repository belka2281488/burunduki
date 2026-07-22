-- Выполни этот файл целиком в Supabase: SQL Editor -> New query -> вставь -> Run
-- Это для НОВОГО проекта, где ещё нет таблиц burunduki / burunduki_videos.
-- Если у тебя они уже есть — используй migration_add_owner.sql вместо этого файла.

-- Таблица с информацией о бурундуках (имя, описание, ссылка на файл)
create table if not exists burunduki (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  name text not null,
  description text,
  owner_name text,
  owner_code text,
  created_at timestamptz not null default now()
);

alter table burunduki enable row level security;

create policy "Allow public read burunduki"
on burunduki for select
to public
using (true);

create policy "Allow public insert burunduki"
on burunduki for insert
to public
with check (true);

create policy "Allow public update burunduki"
on burunduki for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduki"
on burunduki for delete
to public
using (true);


-- ===================================================================
-- Таблица для видео (ссылки на Google Drive, YouTube, TikTok, Tenor)
-- ===================================================================
create table if not exists burunduki_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  source text not null default 'other',
  name text not null,
  description text,
  owner_name text,
  owner_code text,
  created_at timestamptz not null default now()
);

alter table burunduki_videos enable row level security;

create policy "Allow public read burunduki_videos"
on burunduki_videos for select
to public
using (true);

create policy "Allow public insert burunduki_videos"
on burunduki_videos for insert
to public
with check (true);

create policy "Allow public update burunduki_videos"
on burunduki_videos for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduki_videos"
on burunduki_videos for delete
to public
using (true);


-- ===================================================================
-- Таблица оценок ("ранг бурундука" от 1 до 7 вместо звёзд)
-- ===================================================================
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


-- ===================================================================
-- Гиперзадки (валюта: +1 за фото, +2 за видео, можно дарить авторам)
-- ===================================================================
create table if not exists burunduk_gigers (
  owner_code text primary key,
  owner_name text,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table burunduk_gigers enable row level security;

create policy "Allow public read burunduk_gigers"
on burunduk_gigers for select
to public
using (true);

create table if not exists burunduk_giger_gifts (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  giver_code text not null,
  giver_name text,
  owner_code text not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, giver_code)
);

alter table burunduk_giger_gifts enable row level security;

create policy "Allow public read burunduk_giger_gifts"
on burunduk_giger_gifts for select
to public
using (true);

create policy "Allow public insert burunduk_giger_gifts"
on burunduk_giger_gifts for insert
to public
with check (true);

create policy "Allow public update burunduk_giger_gifts"
on burunduk_giger_gifts for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduk_giger_gifts"
on burunduk_giger_gifts for delete
to public
using (true);

create or replace function giger_add(p_code text, p_name text, p_delta int)
returns void as $$
begin
  insert into burunduk_gigers (owner_code, owner_name, count, updated_at)
  values (p_code, p_name, greatest(p_delta, 0), now())
  on conflict (owner_code)
  do update set
    count = burunduk_gigers.count + p_delta,
    owner_name = excluded.owner_name,
    updated_at = now();
end;
$$ language plpgsql security definer;

create or replace function giger_gift(p_giver_code text, p_giver_name text, p_owner_code text, p_owner_name text)
returns boolean as $$
declare
  giver_balance int;
begin
  insert into burunduk_gigers (owner_code, owner_name, count)
  values (p_giver_code, p_giver_name, 0)
  on conflict (owner_code) do nothing;

  select count into giver_balance from burunduk_gigers where owner_code = p_giver_code for update;

  if giver_balance is null or giver_balance < 1 then
    return false;
  end if;

  update burunduk_gigers
  set count = count - 1, owner_name = p_giver_name, updated_at = now()
  where owner_code = p_giver_code;

  insert into burunduk_gigers (owner_code, owner_name, count, updated_at)
  values (p_owner_code, p_owner_name, 1, now())
  on conflict (owner_code)
  do update set
    count = burunduk_gigers.count + 1,
    owner_name = excluded.owner_name,
    updated_at = now();

  return true;
end;
$$ language plpgsql security definer;

create or replace function giger_ungift(p_giver_code text, p_owner_code text)
returns void as $$
begin
  update burunduk_gigers set count = count + 1, updated_at = now() where owner_code = p_giver_code;
  update burunduk_gigers set count = greatest(count - 1, 0), updated_at = now() where owner_code = p_owner_code;
end;
$$ language plpgsql security definer;

grant execute on function giger_add(text, text, int) to anon, authenticated;
grant execute on function giger_gift(text, text, text, text) to anon, authenticated;
grant execute on function giger_ungift(text, text) to anon, authenticated;
-- Выполни этот файл в Supabase, ЕСЛИ у тебя уже есть основные таблицы
-- (burunduki, burunduki_videos, burunduk_ratings, burunduk_gigers,
-- burunduk_giger_gifts).
-- Добавляет счётчик просмотров и центр активности (уведомления о том,
-- кто посмотрел твою публикацию, оставил комментарий или подарил
-- гиперзадку).

-- ===================================================================
-- ПРОСМОТРЫ
-- ===================================================================
-- Одна строка = один уникальный зритель для одной карточки. Так можно
-- посчитать "сколько раз посмотрели" (count(*) по target) и не плодить
-- дубликаты, если один и тот же человек открывает фото много раз.
create table if not exists burunduk_views (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  viewer_code text not null,
  viewer_name text,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, viewer_code)
);

alter table burunduk_views enable row level security;

create policy "Allow public read burunduk_views"
on burunduk_views for select
to public
using (true);

create policy "Allow public insert burunduk_views"
on burunduk_views for insert
to public
with check (true);

-- ===================================================================
-- ЛЕНТА АКТИВНОСТИ
-- ===================================================================
-- Каждое событие, которое должно попасть в "центр активности" владельца
-- карточки: кто-то посмотрел / прокомментировал / подарил гиперзадку.
-- owner_code — кому показывать это уведомление (обычно владелец
-- карточки). actor_code/actor_name — кто это сделал.
create table if not exists burunduk_activity (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('view', 'comment', 'gift')),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  target_name text,
  owner_code text not null,
  actor_code text not null,
  actor_name text,
  extra text, -- для комментариев/подарков можно сохранить текст комментария
  created_at timestamptz not null default now()
);

alter table burunduk_activity enable row level security;

create policy "Allow public read burunduk_activity"
on burunduk_activity for select
to public
using (true);

create policy "Allow public insert burunduk_activity"
on burunduk_activity for insert
to public
with check (true);

create index if not exists idx_burunduk_activity_owner
on burunduk_activity (owner_code, created_at desc);

-- Просмотры и заявки на "view"-событие в ленте активности не должны
-- дублироваться на каждое открытие — функция ниже сама решает, стоит
-- ли добавлять новую строку в ленту (только при первом просмотре этим
-- viewer_code), при этом счётчик просмотров (burunduk_views) всё равно
-- сохраняет уникальную запись зрителя.
create or replace function register_view(
  p_target_type text,
  p_target_id uuid,
  p_target_name text,
  p_owner_code text,
  p_viewer_code text,
  p_viewer_name text
)
returns void as $$
declare
  already_viewed boolean;
begin
  -- Не считаем просмотр своей же публикации и не создаём уведомления
  -- самому себе
  if p_owner_code = p_viewer_code then
    return;
  end if;

  select exists(
    select 1 from burunduk_views
    where target_type = p_target_type
      and target_id = p_target_id
      and viewer_code = p_viewer_code
  ) into already_viewed;

  insert into burunduk_views (target_type, target_id, viewer_code, viewer_name)
  values (p_target_type, p_target_id, p_viewer_code, p_viewer_name)
  on conflict (target_type, target_id, viewer_code) do nothing;

  if not already_viewed then
    insert into burunduk_activity (kind, target_type, target_id, target_name, owner_code, actor_code, actor_name)
    values ('view', p_target_type, p_target_id, p_target_name, p_owner_code, p_viewer_code, p_viewer_name);
  end if;
end;
$$ language plpgsql security definer;

grant execute on function register_view(text, uuid, text, text, text, text) to anon, authenticated;
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
