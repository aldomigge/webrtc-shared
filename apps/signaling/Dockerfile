FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/protocol/package.json ./packages/protocol/
COPY apps/signaling/package.json ./apps/signaling/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/protocol ./packages/protocol
COPY apps/signaling ./apps/signaling

RUN pnpm --filter @screen-room/protocol build && pnpm --filter @screen-room/signaling build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app /app
WORKDIR /app/apps/signaling

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "dist/index.js"]
