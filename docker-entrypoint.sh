#!/bin/sh
set -e

# Ensure uploads directory exists and is writable by nextjs user.
# Needed because Docker named volumes mount as root, overriding image permissions.
mkdir -p /app/uploads
chown nextjs:nodejs /app/uploads

# Drop to nextjs user and exec the CMD
exec su-exec nextjs "$@"
