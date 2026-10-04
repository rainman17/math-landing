#!/usr/bin/env sh
# Резервная копия базы и загруженных изображений. Запускать на сервере из каталога deploy/,
# например по cron каждую ночь:  0 3 * * * cd /srv/mkm/deploy && ../scripts/backup.sh >> backup.log 2>&1
# Хранит KEEP_DAYS последних дней. Копии желательно дополнительно уносить с сервера.
set -eu

KEEP_DAYS="${KEEP_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-../backups}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# shellcheck disable=SC1091
. ./.env.production

$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner \
  > "$BACKUP_DIR/db-$STAMP.dump"

$COMPOSE exec -T app tar -C /app -czf - media > "$BACKUP_DIR/media-$STAMP.tar.gz"

find "$BACKUP_DIR" -name 'db-*.dump' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'media-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Iseconds) backup ok: db-$STAMP.dump, media-$STAMP.tar.gz"
