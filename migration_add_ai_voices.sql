-- ИИ-озвучка: публичная библиотека голосов
-- Выполнить один раз в Supabase SQL Editor.

create table if not exists public.burunduk_ai_voices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sample_r2_key text not null,
  sample_r2_url text not null,
  cover_url text,
  owner_name text,
  owner_code text,
  category_id uuid references public.burunduk_categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_burunduk_ai_voices_created
  on public.burunduk_ai_voices (created_at desc);
create index if not exists idx_burunduk_ai_voices_category
  on public.burunduk_ai_voices (category_id, created_at desc);

alter table public.burunduk_ai_voices enable row level security;

drop policy if exists "Public read AI voices" on public.burunduk_ai_voices;
create policy "Public read AI voices"
  on public.burunduk_ai_voices for select to anon, authenticated using (true);

drop policy if exists "Public insert AI voices" on public.burunduk_ai_voices;
create policy "Public insert AI voices"
  on public.burunduk_ai_voices for insert to anon, authenticated with check (true);

drop policy if exists "Public update AI voices" on public.burunduk_ai_voices;
create policy "Public update AI voices"
  on public.burunduk_ai_voices for update to anon, authenticated using (true) with check (true);

drop policy if exists "Public delete AI voices" on public.burunduk_ai_voices;
create policy "Public delete AI voices"
  on public.burunduk_ai_voices for delete to anon, authenticated using (true);
