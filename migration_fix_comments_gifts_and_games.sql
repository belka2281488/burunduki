-- Исправления: комментарии всех типов, редактирование/удаление,
-- гиперзадка для игр и правильное поведение при удалении комментария.

-- 1. Общие комментарии теперь поддерживают фото, видео и тексты.
alter table burunduk_comments drop constraint if exists burunduk_comments_target_type_check;
alter table burunduk_comments add constraint burunduk_comments_target_type_check
  check (target_type in ('photo','video','text'));
alter table burunduk_comments add column if not exists edited_at timestamptz;

-- 2. Подарки для текстов. Подарок НЕ удаляется при удалении комментария:
-- linked_comment_id уже имеет ON DELETE SET NULL, поэтому гиперзадка
-- остаётся у автора публикации и не возвращается отправителю.
alter table burunduk_giger_gifts drop constraint if exists burunduk_giger_gifts_target_type_check;
alter table burunduk_giger_gifts add constraint burunduk_giger_gifts_target_type_check
  check (target_type in ('photo','video','text'));

-- 3. Играм добавляем настоящий код владельца, чтобы можно было
-- переводить гиперзадку именно автору игры.
alter table burunduk_games add column if not exists owner_code text;
alter table burunduk_games add column if not exists owner_name text;

-- Для новых игр фронтенд заполняет owner_code/owner_name. Старые игры,
-- у которых код владельца неизвестен, не показывают кнопку подарка до тех пор,
-- пока владелец не будет определён.

-- 4. Гиперзадки игр. Удаление комментария НЕ удаляет подарок и НЕ
-- вызывает возврат баланса. game_comment_id лишь обнуляется.
create table if not exists burunduk_game_giger_gifts (
  id uuid primary key default gen_random_uuid(),
  game_id bigint not null references burunduk_games(id) on delete cascade,
  game_comment_id bigint references burunduk_game_comments(id) on delete set null,
  giver_code text not null,
  giver_name text,
  owner_code text not null,
  created_at timestamptz not null default now(),
  unique (game_id, giver_code)
);

alter table burunduk_game_giger_gifts enable row level security;
drop policy if exists game_giger_read on burunduk_game_giger_gifts;
drop policy if exists game_giger_insert on burunduk_game_giger_gifts;
drop policy if exists game_giger_delete on burunduk_game_giger_gifts;
create policy game_giger_read on burunduk_game_giger_gifts for select using (true);
create policy game_giger_insert on burunduk_game_giger_gifts for insert with check (true);
create policy game_giger_delete on burunduk_game_giger_gifts for delete using (true);

alter table burunduk_game_comments add column if not exists edited_at timestamptz;
-- Ответы на игровые комментарии.
alter table burunduk_game_comments
  add column if not exists reply_to_id bigint references burunduk_game_comments(id) on delete set null;

create index if not exists idx_burunduk_game_comments_reply
  on burunduk_game_comments (reply_to_id);

drop policy if exists gcom_update on burunduk_game_comments;
drop policy if exists gcom_delete on burunduk_game_comments;
create policy gcom_update on burunduk_game_comments for update using (true) with check (true);
create policy gcom_delete on burunduk_game_comments for delete using (true);

-- 5. Атомарный подарок игре. При удалении комментария этот подарок
-- остаётся у владельца игры. Возврата дарителю здесь НЕТ.
create or replace function game_giger_gift(
  p_game_id bigint, p_game_comment_id bigint,
  p_giver_code text, p_giver_name text,
  p_owner_code text, p_owner_name text
) returns boolean as $$
declare
  giver_balance int;
begin
  insert into burunduk_gigers(owner_code, owner_name, count)
  values (p_giver_code, p_giver_name, 0)
  on conflict (owner_code) do nothing;

  if exists (select 1 from burunduk_game_giger_gifts where game_id=p_game_id and giver_code=p_giver_code) then
    return false;
  end if;

  select count into giver_balance from burunduk_gigers
  where owner_code=p_giver_code for update;
  if giver_balance is null or giver_balance < 1 then return false; end if;

  update burunduk_gigers set count=count-1, owner_name=p_giver_name, updated_at=now()
  where owner_code=p_giver_code;

  insert into burunduk_gigers(owner_code, owner_name, count, updated_at)
  values (p_owner_code, p_owner_name, 1, now())
  on conflict (owner_code) do update set
    count=burunduk_gigers.count+1, owner_name=excluded.owner_name, updated_at=now();

  insert into burunduk_game_giger_gifts(game_id, game_comment_id, giver_code, giver_name, owner_code)
  values(p_game_id,p_game_comment_id,p_giver_code,p_giver_name,p_owner_code);
  return true;
exception when unique_violation then
  return false;
end;
$$ language plpgsql security definer;

grant execute on function game_giger_gift(bigint,bigint,text,text,text,text) to anon, authenticated;
