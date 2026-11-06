#!/usr/bin/env bash
# Applies the migration to a throwaway local database and runs the authorization tests.
# Usage: bash tests/db/run.sh   (needs a local PostgreSQL you can reach as the postgres user)
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=nara_migration_test
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$(printf '%q ' "$@")"; else "$@"; fi; }
run dropdb --if-exists "$DB"
run createdb "$DB"
cp tests/db/supabase-roles.sql supabase/migrations/*.sql tests/db/authorization.test.sql /tmp/ 2>/dev/null || true
run "${PSQL[@]}" -d "$DB" -f tests/db/supabase-roles.sql
for f in supabase/migrations/*.sql; do run "${PSQL[@]}" -d "$DB" -f "$f"; done
run "${PSQL[@]}" -d "$DB" -f tests/db/authorization.test.sql
run dropdb "$DB"
