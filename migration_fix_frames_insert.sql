-- Выполни, если уже применял migration_add_frames.sql раньше и разблокировка
-- рамок за посты не срабатывала (не хватало policy на insert).
drop policy if exists "Allow public insert burunduk_frames" on burunduk_frames;
create policy "Allow public insert burunduk_frames"
on burunduk_frames for insert
to public
with check (true);
