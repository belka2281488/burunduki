# Перенос аудио в Cloudflare R2

В проекте уже настроена загрузка новых аудиотреков, обложек и дополнительных аудиодорожек в Cloudflare R2 через существующий Worker. `script.js` использует `uploadAudioFileXHR()` и маршруты `/audio/upload` и `/audio/object`; публичные ссылки сохраняются в `burunduk_audio` и `burunduk_audio_voices`.

## Что уже настроено в этом архиве

- `wrangler.toml` использует существующий Worker `mute-grass-7ad4`.
- R2 binding называется `R2_BUCKET` и привязан к существующему bucket `burunduki`.
- Публичный R2 endpoint и Supabase URL оставлены из конфигурации проекта.
- Новые загрузки аудио и обложек направляются в R2, не в Supabase Storage.
- Миграция переносит объекты из `audio/`, `audio-covers/` и `audio-voices/`.
- Оригиналы удаляются из Supabase только после копирования в R2, проверки объекта и успешного обновления связанной записи Supabase. Если связанная запись не найдена, оригинал сохраняется.

## 1. Развернуть обновление существующего Worker

Распакуй архив, открой PowerShell в папке `burunduki-main` и выполни:

```powershell
npx wrangler login
npx wrangler deploy --config wrangler.toml
```

В `wrangler.toml` уже стоит `bucket_name = "burunduki"`. Это обновляет Worker `mute-grass-7ad4`, а не создаёт новый Worker.

## 2. Добавить секреты для безопасной миграции

Нужен Supabase service-role/secret key (не anon/publishable key). Выполни команды по очереди и вставь значение в интерактивный запрос Wrangler:

```powershell
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name mute-grass-7ad4
npx wrangler secret put AUDIO_MIGRATION_SECRET --name mute-grass-7ad4
```

Для `AUDIO_MIGRATION_SECRET` придумай длинный случайный пароль. Секреты не добавляются в публичный JavaScript и не коммить их в GitHub.

## 3. Посмотреть список файлов без переноса и удаления

Вместо `ВАШ_СЕКРЕТ` подставь свой `AUDIO_MIGRATION_SECRET`:

```powershell
$headers = @{ Authorization = "Bearer ВАШ_СЕКРЕТ" }
Invoke-RestMethod -Method Post -Uri "https://mute-grass-7ad4.popatuka0488.workers.dev/admin/migrate-audio" -Headers $headers -ContentType "application/json" -Body '{"confirmMoveAndDelete":false}'
```

Это только preview. Ничего не копируется и не удаляется.

## 4. Запустить перенос

Только после просмотра preview выполни:

```powershell
Invoke-RestMethod -Method Post -Uri "https://mute-grass-7ad4.popatuka0488.workers.dev/admin/migrate-audio" -Headers $headers -ContentType "application/json" -Body '{"confirmMoveAndDelete":true}'
```

Worker копирует объекты в R2 с теми же ключами, проверяет копии, обновляет URL в соответствующих строках базы и удаляет из Supabase Storage только объекты с подтверждённой связью в базе. Не связанные с записью объекты останутся в Supabase и будут отражены в `preservedUnlinked`.

## Важно

Я могу подготовить код и архив, но не могу сам войти в твой Cloudflare/Supabase аккаунт, развернуть Worker или физически перенести файлы без авторизованного доступа к аккаунтам. После deploy нужно выполнить preview и запуск миграции командами выше.

Фото, видео и другие файлы сайта не затрагиваются. Их текущие хранилища остаются без изменений.
