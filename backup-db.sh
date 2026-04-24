#!/bin/bash

# Database Backup Script
# Creates a timestamped backup of the PostgreSQL database

set -e  # Exit on any error

# Configuration (can be overridden via environment variables)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-test_entities_db}  # Default to existing test database
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="${DB_NAME}_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📁 Backup location: $BACKUP_PATH"

# Set password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Create backup using pg_dump with compression
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-password \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_PATH" \
  --no-owner \
  --no-privileges

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"
    echo "📊 Backup file: $BACKUP_PATH"

    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "📏 File size: $FILE_SIZE"

    # Keep only last 10 backups (cleanup old ones)
    cd "$BACKUP_DIR"
    ls -t "${DB_NAME}_backup_"*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f || true
    cd - > /dev/null

    echo "🧹 Cleanup completed - keeping last 10 backups"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Clean up password variable
unset PGPASSWORD

echo "🎉 Backup process completed!"