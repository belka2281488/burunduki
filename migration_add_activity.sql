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
