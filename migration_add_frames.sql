create table if not exists burunduk_frames (
  owner_code text not null,
  frame_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (owner_code, frame_id)
);

alter table burunduk_frames enable row level security;

create policy "Allow public read burunduk_frames"
on burunduk_frames for select
to public
using (true);

create policy "Allow public insert burunduk_frames"
on burunduk_frames for insert
to public
with check (true);

alter table burunduk_profiles add column if not exists equipped_frame text;

create or replace function frame_buy(p_owner_code text, p_owner_name text, p_frame_id text, p_price int)
returns boolean as $$
declare
  giver_balance int;
  already_has int;
begin
  select count(*) into already_has from burunduk_frames where owner_code = p_owner_code and frame_id = p_frame_id;
  if already_has > 0 then
    return true;
  end if;

  select count into giver_balance from burunduk_gigers where owner_code = p_owner_code for update;

  if giver_balance is null or giver_balance < p_price then
    return false;
  end if;

  update burunduk_gigers
  set count = count - p_price, owner_name = p_owner_name, updated_at = now()
  where owner_code = p_owner_code;

  insert into burunduk_frames (owner_code, frame_id) values (p_owner_code, p_frame_id)
  on conflict (owner_code, frame_id) do nothing;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function frame_buy(text, text, text, int) to anon, authenticated;
