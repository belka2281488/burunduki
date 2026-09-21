-- Комментарии: редактирование, удаление и возврат гиперзадки.
-- Запусти один раз в Supabase SQL Editor после старых миграций.

alter table burunduk_comments add column if not exists edited_at timestamptz;
alter table burunduk_comments drop constraint if exists burunduk_comments_target_type_check;
alter table burunduk_comments add constraint burunduk_comments_target_type_check check (target_type in ('photo','video','text'));

alter table burunduk_giger_gifts drop constraint if exists burunduk_giger_gifts_target_type_check;
alter table burunduk_giger_gifts add constraint burunduk_giger_gifts_target_type_check check (target_type in ('photo','video','text'));

create or replace function delete_burunduk_comment(p_comment_id uuid, p_author_code text)
returns boolean as $$
declare c record; g record;
begin
  select * into c from burunduk_comments where id = p_comment_id and author_code = p_author_code for update;
  if not found then return false; end if;

  select * into g from burunduk_giger_gifts where linked_comment_id = p_comment_id for update;
  if found then
    insert into burunduk_gigers(owner_code, owner_name, count, updated_at)
    values(g.giver_code, g.giver_name, 1, now())
    on conflict(owner_code) do update set count=burunduk_gigers.count+1, owner_name=excluded.owner_name, updated_at=now();

    update burunduk_gigers set count=greatest(count-1,0), updated_at=now() where owner_code=g.owner_code;
    delete from burunduk_giger_gifts where id=g.id;
  end if;

  delete from burunduk_comments where id=p_comment_id;
  return true;
end;
$$ language plpgsql security definer;

grant execute on function delete_burunduk_comment(uuid,text) to anon, authenticated;

alter table burunduk_game_comments add column if not exists edited_at timestamptz;
drop policy if exists "gcom_update" on burunduk_game_comments;
drop policy if exists "gcom_delete" on burunduk_game_comments;
create policy "gcom_update" on burunduk_game_comments for update using (true) with check (true);
create policy "gcom_delete" on burunduk_game_comments for delete using (true);
