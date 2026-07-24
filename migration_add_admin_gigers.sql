-- Выполни в Supabase SQL Editor.
-- Добавляет возможность в admin.html бесплатно выдавать гиперзадки
-- любому пользователю по его owner_code — без списания у кого-либо
-- (в отличие от обычного giger_gift, где один дарит другому).

create or replace function admin_grant_gigers(p_owner_code text, p_owner_name text, p_amount int)
returns int as $$
declare
  new_balance int;
begin
  insert into burunduk_gigers (owner_code, owner_name, count)
  values (p_owner_code, p_owner_name, greatest(p_amount, 0))
  on conflict (owner_code)
  do update set
    count = burunduk_gigers.count + p_amount,
    owner_name = coalesce(excluded.owner_name, burunduk_gigers.owner_name),
    updated_at = now();

  select count into new_balance from burunduk_gigers where owner_code = p_owner_code;
  return new_balance;
end;
$$ language plpgsql security definer;

grant execute on function admin_grant_gigers(text, text, int) to anon, authenticated;
