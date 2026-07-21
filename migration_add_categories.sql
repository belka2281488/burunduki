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
