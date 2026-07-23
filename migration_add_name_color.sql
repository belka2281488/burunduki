-- Добавляет возможность красить ник: сплошной цвет или градиент.
-- name_color хранит либо hex-цвет ('#ff0000'), либо CSS-градиент
-- ('linear-gradient(90deg, #ff0000, #00ff00)').
alter table burunduk_profiles add column if not exists name_color text;
