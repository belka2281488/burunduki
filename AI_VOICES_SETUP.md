# ИИ-озвучка Burunduki

ИИ-озвучка использует тот же Cloudflare Worker и тот же существующий R2 bucket, что и аудиосистема. Отдельный Worker не создаётся. Адрес Worker уже прописан в `config.js`.

1. Выполни `migration_add_ai_voices.sql` в Supabase SQL Editor.
2. В `wrangler.toml` укажи точное имя существующего R2 bucket. Binding должен называться `R2_BUCKET`.
3. Обнови существующий Worker `mute-grass-7ad4` командой `npx wrangler deploy --config wrangler.toml`.
4. Добавь секрет Hugging Face: `npx wrangler secret put HF_TOKEN --name mute-grass-7ad4`.
5. Используй `MIGRATE_AUDIO_TO_R2.md`, чтобы перенести существующие аудиофайлы из Supabase Storage в R2. Для миграции дополнительно потребуются `SUPABASE_SERVICE_ROLE_KEY` и `AUDIO_MIGRATION_SECRET`.

Голоса хранятся метаданными в `burunduk_ai_voices`, а образцы — в R2. Сгенерированный результат передаётся браузеру как временный файл и не сохраняется автоматически.
