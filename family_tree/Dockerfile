# Base image
FROM node:20-bullseye-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apt-get update && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use the entrypoint script to run migrations and start the server
CMD ["./entrypoint.sh"]
