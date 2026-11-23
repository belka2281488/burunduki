-- ===================================================================
-- Таблица для аудио треков
-- Выполни в Supabase → SQL Editor
-- ===================================================================

create table if not exists burunduk_audio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  r2_key text not null,
  r2_url text not null,
  duration_sec integer,
  cover_r2_key text,
  cover_r2_url text,
  owner_name text,
  owner_code text,
  followers_only boolean not null default false,
  category_id uuid references burunduk_categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table burunduk_audio enable row level security;

create policy "Allow public read burunduk_audio"
  on burunduk_audio for select to public using (true);
create policy "Allow public insert burunduk_audio"
  on burunduk_audio for insert to public with check (true);
create policy "Allow public update burunduk_audio"
  on burunduk_audio for update to public using (true) with check (true);
create policy "Allow public delete burunduk_audio"
  on burunduk_audio for delete to public using (true);

-- comments
ALTER TABLE burunduk_comments
  DROP CONSTRAINT IF EXISTS burunduk_comments_target_type_check;
ALTER TABLE burunduk_comments
  ADD CONSTRAINT burunduk_comments_target_type_check
  CHECK (target_type in ('photo','video','text','audio'));

-- ratings — сначала удаляем старый, потом добавляем новый
ALTER TABLE burunduk_ratings
  DROP CONSTRAINT IF EXISTS burunduk_ratings_target_type_check;
ALTER TABLE burunduk_ratings
  ADD CONSTRAINT burunduk_ratings_target_type_check
  CHECK (target_type in ('photo','video','text','audio'));

-- views и kurymdyk_unlocks — обёрнуто в DO чтобы не падало если таблицы нет
DO $$ BEGIN
  ALTER TABLE burunduk_views
    DROP CONSTRAINT IF EXISTS burunduk_views_target_type_check;
  ALTER TABLE burunduki_views
    ADD CONSTRAINT burunduk_views_target_type_check
    CHECK (target_type in ('photo','video','text','audio'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE burunduk_kurymdyk_unlocks
    DROP CONSTRAINT IF EXISTS burunduk_kurymdyk_unlocks_target_type_check;
  ALTER TABLE burunduk_kurymdyk_unlocks
    ADD CONSTRAINT burunduk_kurymdyk_unlocks_target_type_check
    CHECK (target_type in ('photo','video','text','audio'));
EXCEPTION WHEN others THEN NULL; END $$;
