-- Выполни в Supabase SQL Editor.
-- Раньше радужное выделение комментария (за подарок гиперзадки) считалось
-- по автору комментария целиком — из-за этого ВСЕ комментарии человека
-- к посту становились радужными, стоило подарить один раз.
-- Теперь подарок явно привязывается к ОДНОМУ конкретному комментарию,
-- вместе с которым он был отправлен.

alter table burunduk_giger_gifts
  add column if not exists linked_comment_id uuid references burunduk_comments (id) on delete set null;
