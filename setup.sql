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
