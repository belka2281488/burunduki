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
