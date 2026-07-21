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
