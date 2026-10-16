FROM node:24 AS builder
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm build

FROM node:24 AS production
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=1m --timeout=5s --start-period=20s --retries=1 CMD curl -S --fail http://localhost:8080/health

EXPOSE 8080
ENTRYPOINT ["pnpm", "start"]
