-- ===================================================================
-- Таблица для текстовых постов (с поддержкой Google Docs)
-- Выполни этот файл в Supabase → SQL Editor
-- ===================================================================

create table if not exists burunduk_texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  gdoc_url text,
  gdoc_refreshed_at timestamptz,
  owner_name text,
  owner_code text,
  followers_only boolean not null default false,
  category_id uuid references burunduk_categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table burunduk_texts enable row level security;

create policy "Allow public read burunduk_texts"
on burunduk_texts for select
to public
using (true);

create policy "Allow public insert burunduk_texts"
on burunduk_texts for insert
to public
with check (true);

create policy "Allow public update burunduk_texts"
on burunduk_texts for update
to public
using (true)
with check (true);

create policy "Allow public delete burunduk_texts"
on burunduk_texts for delete
to public
using (true);

-- Расширяем target_type в burunduk_comments для поддержки 'text'
ALTER TABLE burunduk_comments DROP CONSTRAINT IF EXISTS burunduk_comments_target_type_check;
ALTER TABLE burunduk_comments ADD CONSTRAINT burunduk_comments_target_type_check
  CHECK (target_type in ('photo', 'video', 'text'));

-- Также в burunduk_ratings, burunduk_views, burunduk_kurymdyk_unlocks — если понадобится позже
-- (текстовые посты пока без рейтингов и просмотров, только комментарии)
