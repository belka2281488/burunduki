-- Запусти в Supabase SQL Editor один раз для поддержки собственных превью видео.
alter table public.burunduki_videos
  add column if not exists preview_r2_url text,
  add column if not exists preview_r2_key text;
