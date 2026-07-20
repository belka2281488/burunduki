-- Выполни этот файл целиком в Supabase: SQL Editor -> New query -> вставь -> Run

-- Таблица с информацией о бурундуках (имя, описание, ссылка на файл)
create table if not exists burunduki (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Включаем защиту на уровне строк (обязательно для Supabase)
alter table burunduki enable row level security;

-- Разрешаем всем читать список бурундуков
create policy "Allow public read burunduki"
on burunduki for select
to public
using (true);

-- Разрешаем всем добавлять новых бурундуков
create policy "Allow public insert burunduki"
on burunduki for insert
to public
with check (true);

-- Разрешаем всем редактировать (название/описание)
create policy "Allow public update burunduki"
on burunduki for update
to public
using (true)
with check (true);

-- Разрешаем всем удалять
create policy "Allow public delete burunduki"
on burunduki for delete
to public
using (true);
