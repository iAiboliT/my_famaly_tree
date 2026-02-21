#!/bin/sh
set -e

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node server.js
