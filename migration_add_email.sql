-- Добавляем поле email в burunduk_profiles
ALTER TABLE burunduk_profiles
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;

-- Уникальный индекс: один email — один аккаунт
-- (допускает NULL, т.е. пользователи без email не конфликтуют)
CREATE UNIQUE INDEX IF NOT EXISTS burunduk_profiles_email_unique
  ON burunduk_profiles (email)
  WHERE email IS NOT NULL;

-- RLS: пользователь может обновить email только своей строки
-- (RLS уже должна быть включена на таблице из migration_add_profiles.sql)
-- Если нужно — добавь policy через Supabase Dashboard вручную.
