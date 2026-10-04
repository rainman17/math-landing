#!/usr/bin/env sh
# Восстановление из копии. Запускать на сервере из каталога deploy/:
#   ../scripts/restore.sh ../backups/db-20261101-030000.dump [../backups/media-20261101-030000.tar.gz]
# ВНИМАНИЕ: текущие данные базы будут заменены данными из копии.
set -eu

DB_DUMP="${1:?Укажите файл db-*.dump}"
MEDIA_ARCHIVE="${2:-}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

# shellcheck disable=SC1091
. ./.env.production

$COMPOSE stop app
$COMPOSE exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner < "$DB_DUMP"
if [ -n "$MEDIA_ARCHIVE" ]; then
  $COMPOSE run --rm -T --entrypoint sh app -c 'rm -rf /app/media/* && tar -C /app -xzf -' < "$MEDIA_ARCHIVE"
fi
$COMPOSE start app
echo "Восстановлено из $DB_DUMP"
