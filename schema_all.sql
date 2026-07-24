-- ============================================================================
--  ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ (Supabase / Postgres) — "Галерея бурундуков"
-- ============================================================================
--
--  Этот файл — просто СПРАВОЧНИК. Раньше миграций было много отдельных
--  файлов (setup.sql, migration_add_....sql), пользователь попросил
--  объединить их в один, чтобы не было кучи лишних файлов в проекте.
--
--  Все команды ниже уже когда-то были выполнены в Supabase SQL Editor
--  (в этом самом порядке). Повторно всё целиком выполнять не нужно —
--  большинство команд написаны так, что их можно перезапускать безопасно
--  (if not exists / or replace), но это НЕ гарантия для 100% случаев,
--  поэтому лучше не гонять этот файл целиком на уже рабочей базе.
--
--  ЕСЛИ НУЖНО ДОБАВИТЬ ЧТО-ТО НОВОЕ В БАЗУ (новая функция, новая колонка,
--  новая таблица) — НЕ дописывай это в конец этого файла. Создавай
--  ОТДЕЛЬНЫЙ новый файл (например migration_add_<название>.sql), пиши
--  туда только новые команды и выполняй его отдельно в Supabase. Когда
--  всё заработает, при желании можно попросить объединить всё заново в
--  этот файл, как в этот раз.
--
--  Секции ниже идут строго в том порядке, в котором миграции применялись
--  в реальности (это важно, так как более поздние миграции опираются на
--  таблицы/колонки из более ранних).
--
-- ============================================================================

-- ----------------------------------------------------------------------
-- Раздел: setup.sql
-- ----------------------------------------------------------------------
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
  kind text not null check (kind in ('view', 'comment', 'gift', 'new_post', 'follow')),
  target_type text not null check (target_type in ('photo', 'video', 'profile')),
  target_id uuid,
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
-- Выполни в Supabase SQL Editor.
-- Добавляет флаг "только для подписчиков" к фото и видео.
-- По умолчанию false (публикация видна всем, как раньше).

alter table burunduki add column if not exists followers_only boolean not null default false;
alter table burunduki_videos add column if not exists followers_only boolean not null default false;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_owner.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_ratings.sql
-- ----------------------------------------------------------------------
-- Выполни этот файл в Supabase, ЕСЛИ у тебя уже есть таблицы
-- burunduki и burunduki_videos (созданные раньше через setup.sql).
-- Он добавляет новую таблицу для системы оценок ("ранг бурундука"
-- от 1 до 7 вместо звёзд), старые таблицы не трогает.

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

-- Уникальность (target_type, target_id, rater_code) означает: один и
-- тот же человек (браузер) может поставить только одну оценку одному
-- фото/видео — если оценивает второй раз, старая оценка обновляется
-- (это делает сайт через upsert), а не создаётся вторая запись.


-- ----------------------------------------------------------------------
-- Раздел: migration_add_gigers.sql
-- ----------------------------------------------------------------------
-- Выполни этот файл в Supabase, ЕСЛИ у тебя уже есть основные таблицы
-- (burunduki, burunduki_videos, burunduk_ratings).
-- Добавляет систему "гиперзадок" — валюту, которую получаешь за
-- публикации и можешь дарить авторам чужих карточек.

-- Баланс гиперзадок на человека (owner_code — тот же код, что и у
-- владельца фото/видео/оценки).
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

-- Изменение баланса разрешено только через функцию ниже (security
-- definer), поэтому политики на insert/update здесь намеренно узкие —
-- напрямую менять баланс с фронта нельзя, только вызовом функции.

-- Подарки — кто кому подарил гиперзадку по какой карточке. Уникальность
-- (target_type, target_id, giver_code) гарантирует не больше одного
-- подарка от одного человека одной карточке.
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

-- ===================================================================
-- Функции для атомарного изменения баланса (чтобы не было гонок и
-- уходов в минус при параллельных запросах)
-- ===================================================================

-- Просто начислить/списать N гиперзадок владельцу (используется при
-- публикации фото/видео — начисление, гонки тут не критичны).
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

-- Подарить 1 гиперзадку: списать у дарителя, начислить автору.
-- Возвращает true, если получилось (у дарителя хватило баланса),
-- false — если у дарителя было 0 гиперзадок (перевод не происходит).
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

-- Отменить подарок (сняли галочку): вернуть гиперзадку дарителю,
-- забрать у автора.
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_categories.sql
-- ----------------------------------------------------------------------
-- Выполни этот файл в Supabase: SQL Editor -> New query -> вставь -> Run
-- Добавляет разделы (категории) для фото: "бурундуки" уже есть по умолчанию,
-- пользователи могут предлагать свои — они попадают в заявки и появляются
-- в общем списке только после одобрения через админ-панель.

-- Таблица разделов
create table if not exists burunduk_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'approved' check (status in ('approved', 'pending', 'rejected')),
  created_by_name text,
  created_by_code text,
  created_at timestamptz not null default now()
);

alter table burunduk_categories enable row level security;

create policy "Allow public read burunduk_categories"
on burunduk_categories for select
to public
using (true);

create policy "Allow public insert burunduk_categories"
on burunduk_categories for insert
to public
with check (true);

create policy "Allow public update burunduk_categories"
on burunduk_categories for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduk_categories"
on burunduk_categories for delete
to public
using (true);

-- Дефолтный раздел
insert into burunduk_categories (name, status)
values ('Бурундуки', 'approved')
on conflict (name) do nothing;

-- Привязка фото к разделу
alter table burunduki
  add column if not exists category_id uuid references burunduk_categories(id);

-- Проставляем старым фото раздел "Бурундуки" по умолчанию
update burunduki
set category_id = (select id from burunduk_categories where name = 'Бурундуки')
where category_id is null;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_videos.sql
-- ----------------------------------------------------------------------
-- Выполни этот файл, ЕСЛИ ты уже раньше выполнял setup.sql
-- и таблица burunduki у тебя уже есть.
-- Этот файл только добавляет новую таблицу для видео, старое не трогает.

create table if not exists burunduki_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  source text not null default 'other', -- google_drive | youtube | tiktok | tenor | other
  name text not null,
  description text,
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_video_categories.sql
-- ----------------------------------------------------------------------
-- Выполни в Supabase SQL Editor ПОСЛЕ migration_add_categories.sql
-- Добавляет разделы (категории) и для видео тоже.

alter table burunduki_videos
  add column if not exists category_id uuid references burunduk_categories(id);

update burunduki_videos
set category_id = (select id from burunduk_categories where name = 'Бурундуки')
where category_id is null;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_pinned.sql
-- ----------------------------------------------------------------------
-- Выполни этот файл в Supabase SQL Editor.
-- Добавляет "закреп" — публикацию можно закрепить в своём профиле,
-- она всегда будет показываться первой (как закреп в соцсетях).

alter table burunduki add column if not exists pinned boolean not null default false;
alter table burunduki_videos add column if not exists pinned boolean not null default false;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_comments.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_profiles.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_followers_only.sql
-- ----------------------------------------------------------------------
-- Выполни в Supabase SQL Editor.
-- Добавляет флаг "только для подписчиков" к фото и видео.
-- По умолчанию false (публикация видна всем, как раньше).

alter table burunduki add column if not exists followers_only boolean not null default false;
alter table burunduki_videos add column if not exists followers_only boolean not null default false;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_follow_notifications.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_activity.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_enable_realtime.sql
-- ----------------------------------------------------------------------
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


-- ----------------------------------------------------------------------
-- Раздел: migration_add_frames.sql
-- ----------------------------------------------------------------------
create table if not exists burunduk_frames (
  owner_code text not null,
  frame_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (owner_code, frame_id)
);

alter table burunduk_frames enable row level security;

create policy "Allow public read burunduk_frames"
on burunduk_frames for select
to public
using (true);

create policy "Allow public insert burunduk_frames"
on burunduk_frames for insert
to public
with check (true);

alter table burunduk_profiles add column if not exists equipped_frame text;

create or replace function frame_buy(p_owner_code text, p_owner_name text, p_frame_id text, p_price int)
returns boolean as $$
declare
  giver_balance int;
  already_has int;
begin
  select count(*) into already_has from burunduk_frames where owner_code = p_owner_code and frame_id = p_frame_id;
  if already_has > 0 then
    return true;
  end if;

  select count into giver_balance from burunduk_gigers where owner_code = p_owner_code for update;

  if giver_balance is null or giver_balance < p_price then
    return false;
  end if;

  update burunduk_gigers
  set count = count - p_price, owner_name = p_owner_name, updated_at = now()
  where owner_code = p_owner_code;

  insert into burunduk_frames (owner_code, frame_id) values (p_owner_code, p_frame_id)
  on conflict (owner_code, frame_id) do nothing;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function frame_buy(text, text, text, int) to anon, authenticated;


-- ----------------------------------------------------------------------
-- Раздел: migration_fix_frames_insert.sql
-- ----------------------------------------------------------------------
-- Выполни, если уже применял migration_add_frames.sql раньше и разблокировка
-- рамок за посты не срабатывала (не хватало policy на insert).
drop policy if exists "Allow public insert burunduk_frames" on burunduk_frames;
create policy "Allow public insert burunduk_frames"
on burunduk_frames for insert
to public
with check (true);


-- ----------------------------------------------------------------------
-- Раздел: migration_add_name_color.sql
-- ----------------------------------------------------------------------
-- Добавляет возможность красить ник: сплошной цвет или градиент.
-- name_color хранит либо hex-цвет ('#ff0000'), либо CSS-градиент
-- ('linear-gradient(90deg, #ff0000, #00ff00)').
alter table burunduk_profiles add column if not exists name_color text;


-- ----------------------------------------------------------------------
-- Раздел: migration_add_kurymdyk.sql
-- ----------------------------------------------------------------------
-- Выполни в Supabase SQL Editor.
-- Добавляет "курымдык" — платный просмотр фото/видео за гиперзадки.
-- kurymdyk_price = 0 значит контент открыт всем как обычно.
-- kurymdyk_price от 1 до 10 значит нужно подарить столько гиперзадок
-- автору, чтобы увидеть настоящее название/фото/видео/описание.

alter table burunduki add column if not exists kurymdyk_price integer not null default 0;
alter table burunduki_videos add column if not exists kurymdyk_price integer not null default 0;

-- Кто уже разблокировал (оплатил) конкретную карточку.
create table if not exists burunduk_kurymdyk_unlocks (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'video')),
  target_id uuid not null,
  viewer_code text not null,
  viewer_name text,
  owner_code text not null,
  price integer not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, viewer_code)
);

alter table burunduk_kurymdyk_unlocks enable row level security;

create policy "Allow public read burunduk_kurymdyk_unlocks"
on burunduk_kurymdyk_unlocks for select
to public
using (true);

-- Списывает у зрителя p_price гиперзадок и начисляет их автору, затем
-- фиксирует разблокировку. Возвращает true при успехе, false если у
-- зрителя не хватило гиперзадок.
create or replace function kurymdyk_unlock(
  p_target_type text,
  p_target_id uuid,
  p_viewer_code text,
  p_viewer_name text,
  p_owner_code text,
  p_price int
)
returns boolean as $$
declare
  viewer_balance int;
  already_unlocked int;
begin
  select count(*) into already_unlocked
  from burunduk_kurymdyk_unlocks
  where target_type = p_target_type and target_id = p_target_id and viewer_code = p_viewer_code;

  if already_unlocked > 0 then
    return true;
  end if;

  insert into burunduk_gigers (owner_code, owner_name, count)
  values (p_viewer_code, p_viewer_name, 0)
  on conflict (owner_code) do nothing;

  select count into viewer_balance from burunduk_gigers where owner_code = p_viewer_code for update;

  if viewer_balance is null or viewer_balance < p_price then
    return false;
  end if;

  update burunduk_gigers
  set count = count - p_price, owner_name = p_viewer_name, updated_at = now()
  where owner_code = p_viewer_code;

  insert into burunduk_gigers (owner_code, owner_name, count, updated_at)
  values (p_owner_code, null, p_price, now())
  on conflict (owner_code)
  do update set
    count = burunduk_gigers.count + p_price,
    updated_at = now();

  insert into burunduk_kurymdyk_unlocks (target_type, target_id, viewer_code, viewer_name, owner_code, price)
  values (p_target_type, p_target_id, p_viewer_code, p_viewer_name, p_owner_code, p_price)
  on conflict (target_type, target_id, viewer_code) do nothing;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function kurymdyk_unlock(text, uuid, text, text, text, int) to anon, authenticated;

