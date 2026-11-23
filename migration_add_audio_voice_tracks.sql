-- =====================================================================
-- Дополнительные озвучки аудиокниг + выбор получателей гиперзадок.
-- Выполнить один раз в Supabase -> SQL Editor ПОСЛЕ основных миграций проекта,
-- включая migration_add_gigers.sql, migration_add_activity.sql,
-- migration_add_audio.sql и migration_fix_audio_interactions.sql.
-- =====================================================================

begin;

-- У аудио может быть несколько подтверждённых дорожек от разных дикторов.
create table if not exists public.burunduk_audio_voices (
  id uuid primary key default gen_random_uuid(),
  audio_id uuid not null references public.burunduk_audio(id) on delete cascade,
  voice_name text not null,
  storage_key text not null,
  storage_url text not null,
  duration_sec integer,
  owner_code text not null,
  owner_name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists idx_burunduk_audio_voices_audio_status
  on public.burunduk_audio_voices (audio_id, status, created_at);
create index if not exists idx_burunduk_audio_voices_owner
  on public.burunduk_audio_voices (owner_code, created_at desc);

alter table public.burunduk_audio_voices enable row level security;
drop policy if exists "Audio voice tracks are publicly readable" on public.burunduk_audio_voices;
drop policy if exists "Approved audio voice tracks are publicly readable" on public.burunduk_audio_voices;
grant select on public.burunduk_audio_voices to anon, authenticated;
create policy "Approved audio voice tracks are publicly readable"
  on public.burunduk_audio_voices for select to public using (status = 'approved');

-- Активность: заявке нужен идентификатор самой дорожки, а также флаг,
-- чтобы после решения автора она исчезала из списка ожидающих заявок.
alter table public.burunduk_activity
  add column if not exists related_id uuid,
  add column if not exists resolved_at timestamptz;

alter table public.burunduk_activity
  alter column target_id drop not null;

alter table public.burunduk_activity
  drop constraint if exists burunduk_activity_target_type_check;
alter table public.burunduk_activity
  add constraint burunduk_activity_target_type_check
  check (target_type in ('photo', 'video', 'text', 'profile', 'audio'));

alter table public.burunduk_activity
  drop constraint if exists burunduk_activity_kind_check;
alter table public.burunduk_activity
  add constraint burunduk_activity_kind_check
  check (kind in (
    'view', 'comment', 'gift', 'new_post', 'follow',
    'audio_voice_request', 'audio_voice_approved', 'audio_voice_rejected'
  ));

create index if not exists idx_burunduk_activity_related_id
  on public.burunduk_activity (related_id)
  where related_id is not null;

-- Подарки аудио теперь уникальны для пары "даритель + получатель".
-- Старое ограничение не позволяло одному человеку поддержать и автора,
-- и другого диктора одной и той же аудиокниги.
alter table public.burunduk_giger_gifts
  drop constraint if exists burunduk_giger_gifts_target_type_check;
alter table public.burunduk_giger_gifts
  add constraint burunduk_giger_gifts_target_type_check
  check (target_type in ('photo', 'video', 'text', 'audio'));

alter table public.burunduk_giger_gifts
  add column if not exists linked_comment_id uuid
  references public.burunduk_comments(id) on delete set null;

alter table public.burunduk_giger_gifts
  drop constraint if exists burunduk_giger_gifts_target_type_target_id_giver_code_key;
-- Для фото/видео/текста сохраняем прежнее правило: один подарок на публикацию.
create unique index if not exists idx_burunduk_giger_gifts_non_audio_unique
  on public.burunduk_giger_gifts (target_type, target_id, giver_code)
  where target_type <> 'audio';
-- Для аудио — отдельный подарок каждому участнику озвучки.
create unique index if not exists idx_burunduk_giger_gifts_recipient_unique
  on public.burunduk_giger_gifts (target_type, target_id, giver_code, owner_code);

-- Создать новую дорожку. Если её добавляет сам автор аудиокниги,
-- она сразу публикуется. Если другой пользователь — попадает автору в заявки.
create or replace function public.add_audio_voice_track(
  p_audio_id uuid,
  p_voice_name text,
  p_storage_key text,
  p_storage_url text,
  p_duration_sec integer,
  p_uploader_code text,
  p_uploader_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audio_owner text;
  v_audio_title text;
  v_track_id uuid;
  v_status text;
begin
  if coalesce(trim(p_voice_name), '') = '' then
    raise exception 'Укажи название озвучки';
  end if;
  if coalesce(trim(p_storage_key), '') = '' or coalesce(trim(p_storage_url), '') = '' then
    raise exception 'Не найден загруженный аудиофайл';
  end if;
  if coalesce(trim(p_uploader_code), '') = '' then
    raise exception 'Не удалось определить автора озвучки';
  end if;

  select owner_code, title
    into v_audio_owner, v_audio_title
  from public.burunduk_audio
  where id = p_audio_id;

  if not found then
    raise exception 'Исходная аудиозапись не найдена';
  end if;
  if v_audio_owner is null then
    raise exception 'У этой аудиозаписи не указан автор, поэтому запрос на озвучку отправить некому';
  end if;

  v_status := case when v_audio_owner = p_uploader_code then 'approved' else 'pending' end;

  insert into public.burunduk_audio_voices (
    audio_id, voice_name, storage_key, storage_url, duration_sec,
    owner_code, owner_name, status, approved_at
  ) values (
    p_audio_id, trim(p_voice_name), p_storage_key, p_storage_url, p_duration_sec,
    p_uploader_code, p_uploader_name, v_status,
    case when v_status = 'approved' then now() else null end
  ) returning id into v_track_id;

  if v_status = 'pending' then
    insert into public.burunduk_activity (
      kind, target_type, target_id, target_name,
      owner_code, actor_code, actor_name, extra, related_id
    ) values (
      'audio_voice_request', 'audio', p_audio_id, v_audio_title,
      v_audio_owner, p_uploader_code, p_uploader_name,
      trim(p_voice_name), v_track_id
    );
  end if;

  return jsonb_build_object('id', v_track_id, 'status', v_status);
end;
$$;

grant execute on function public.add_audio_voice_track(uuid, text, text, text, integer, text, text)
  to anon, authenticated;

-- Одобрение/отклонение заявки. Только владелец исходной аудиокниги
-- может принять решение; повторно обработать заявку нельзя.
drop function if exists public.review_audio_voice_track(uuid, text, boolean, text);
create function public.review_audio_voice_track(
  p_track_id uuid,
  p_owner_code text,
  p_approve boolean,
  p_owner_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track public.burunduk_audio_voices%rowtype;
  v_audio_owner text;
  v_audio_title text;
  v_new_status text;
begin
  select * into v_track
  from public.burunduk_audio_voices
  where id = p_track_id and status = 'pending'
  for update;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  select owner_code, title into v_audio_owner, v_audio_title
  from public.burunduk_audio
  where id = v_track.audio_id;

  if v_audio_owner is null or v_audio_owner <> p_owner_code then
    return jsonb_build_object('ok', false);
  end if;

  v_new_status := case when p_approve then 'approved' else 'rejected' end;
  update public.burunduk_audio_voices
  set status = v_new_status,
      approved_at = case when p_approve then now() else null end
  where id = p_track_id;

  update public.burunduk_activity
  set resolved_at = now()
  where kind = 'audio_voice_request'
    and related_id = p_track_id
    and owner_code = p_owner_code
    and resolved_at is null;

  if v_track.owner_code <> p_owner_code then
    insert into public.burunduk_activity (
      kind, target_type, target_id, target_name,
      owner_code, actor_code, actor_name, extra, related_id
    ) values (
      case when p_approve then 'audio_voice_approved' else 'audio_voice_rejected' end,
      'audio', v_track.audio_id, v_audio_title,
      v_track.owner_code, p_owner_code, p_owner_name,
      v_track.voice_name, p_track_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'storage_key', case when p_approve then null else v_track.storage_key end
  );
end;
$$;

grant execute on function public.review_audio_voice_track(uuid, text, boolean, text)
  to anon, authenticated;

-- Получить все ключи дорожек перед удалением исходной аудиокниги,
-- включая ожидающие подтверждения записи (они скрыты общей RLS-политикой).
create or replace function public.audio_voice_storage_keys_for_delete(
  p_audio_id uuid,
  p_owner_code text
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_keys text[];
begin
  if not exists (
    select 1 from public.burunduk_audio
    where id = p_audio_id and owner_code = p_owner_code
  ) then
    return array[]::text[];
  end if;
  update public.burunduk_activity
  set resolved_at = now()
  where target_type = 'audio'
    and target_id = p_audio_id
    and kind = 'audio_voice_request'
    and resolved_at is null;
  select coalesce(array_agg(storage_key), array[]::text[])
    into v_keys
  from public.burunduk_audio_voices
  where audio_id = p_audio_id;
  return v_keys;
end;
$$;

grant execute on function public.audio_voice_storage_keys_for_delete(uuid, text)
  to anon, authenticated;

-- Удалить дорожку может автор исходной аудиокниги. Функция возвращает
-- ключ Storage, чтобы фронтенд удалил сам файл после успешного удаления записи.
create or replace function public.delete_audio_voice_track(
  p_track_id uuid,
  p_owner_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_storage_key text;
begin
  select v.storage_key into v_storage_key
  from public.burunduk_audio_voices v
  join public.burunduk_audio a on a.id = v.audio_id
  where v.id = p_track_id and a.owner_code = p_owner_code
  for update of v;

  if not found then
    return null;
  end if;

  delete from public.burunduk_audio_voices where id = p_track_id;
  return v_storage_key;
end;
$$;

grant execute on function public.delete_audio_voice_track(uuid, text)
  to anon, authenticated;

-- Подарок одному выбранному участнику аудиокниги. Разрешённые получатели:
-- автор исходной публикации и авторы подтверждённых дополнительных дорожек.
-- Одна и та же аудиокнига может получить по подарку от одного дарителя
-- для каждого участника, но не дважды одному и тому же человеку.
create or replace function public.audio_giger_gift(
  p_audio_id uuid,
  p_giver_code text,
  p_giver_name text,
  p_recipient_code text,
  p_recipient_name text,
  p_comment text,
  p_linked_comment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audio_owner text;
  v_audio_title text;
  v_valid_recipient boolean := false;
  v_giver_balance integer;
  v_gift_id uuid;
begin
  if p_giver_code is null or p_recipient_code is null or p_giver_code = p_recipient_code then
    return false;
  end if;

  select owner_code, title into v_audio_owner, v_audio_title
  from public.burunduk_audio
  where id = p_audio_id;
  if not found then return false; end if;

  if p_recipient_code = v_audio_owner then
    v_valid_recipient := true;
  else
    select exists (
      select 1 from public.burunduk_audio_voices
      where audio_id = p_audio_id
        and owner_code = p_recipient_code
        and status = 'approved'
    ) into v_valid_recipient;
  end if;
  if not v_valid_recipient then return false; end if;

  insert into public.burunduk_giger_gifts (
    target_type, target_id, giver_code, giver_name, owner_code,
    comment, linked_comment_id
  ) values (
    'audio', p_audio_id, p_giver_code, p_giver_name, p_recipient_code,
    p_comment, p_linked_comment_id
  )
  on conflict (target_type, target_id, giver_code, owner_code) do nothing
  returning id into v_gift_id;

  if v_gift_id is null then return false; end if;

  insert into public.burunduk_gigers (owner_code, owner_name, count, updated_at)
  values (p_giver_code, p_giver_name, 0, now())
  on conflict (owner_code) do nothing;

  select count into v_giver_balance
  from public.burunduk_gigers
  where owner_code = p_giver_code
  for update;

  if v_giver_balance is null or v_giver_balance < 1 then
    delete from public.burunduk_giger_gifts where id = v_gift_id;
    return false;
  end if;

  update public.burunduk_gigers
  set count = count - 1, owner_name = p_giver_name, updated_at = now()
  where owner_code = p_giver_code;

  insert into public.burunduk_gigers (owner_code, owner_name, count, updated_at)
  values (p_recipient_code, p_recipient_name, 1, now())
  on conflict (owner_code) do update set
    count = burunduk_gigers.count + 1,
    owner_name = excluded.owner_name,
    updated_at = now();

  insert into public.burunduk_activity (
    kind, target_type, target_id, target_name,
    owner_code, actor_code, actor_name, extra
  ) values (
    'gift', 'audio', p_audio_id, v_audio_title,
    p_recipient_code, p_giver_code, p_giver_name, p_comment
  );

  return true;
end;
$$;

grant execute on function public.audio_giger_gift(uuid, text, text, text, text, text, uuid)
  to anon, authenticated;

commit;
