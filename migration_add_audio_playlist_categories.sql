-- Категории для аудио и плейлистов.
-- Выполнить в Supabase SQL Editor после migration_add_categories.sql
-- и migration_add_playlists.sql.

-- В audio category_id уже предусмотрен migration_add_audio.sql.
-- Повторно добавляем его безопасно для старых установок.
alter table public.burunduk_audio
  add column if not exists category_id uuid references public.burunduk_categories(id) on delete set null;

-- Старые аудиозаписи без выбранного раздела помещаем в стандартный раздел.
update public.burunduk_audio
set category_id = (
  select id from public.burunduk_categories
  where name = 'Бурундуки' and status = 'approved'
  limit 1
)
where category_id is null
  and exists (
    select 1 from public.burunduk_categories
    where name = 'Бурундуки' and status = 'approved'
  );

-- У публичного плейлиста теперь тоже есть раздел.
alter table public.burunduk_playlists
  add column if not exists category_id uuid references public.burunduk_categories(id) on delete set null;

create index if not exists idx_burunduk_playlists_category_public
  on public.burunduk_playlists (category_id, is_public, created_at desc);

-- Старые публичные плейлисты по умолчанию относятся к «Бурундуки».
update public.burunduk_playlists
set category_id = (
  select id from public.burunduk_categories
  where name = 'Бурундуки' and status = 'approved'
  limit 1
)
where is_public = true
  and category_id is null
  and exists (
    select 1 from public.burunduk_categories
    where name = 'Бурундуки' and status = 'approved'
  );
