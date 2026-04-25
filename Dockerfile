FROM node:22 AS builder
WORKDIR /app

RUN npm install -g pnpm@10.15.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm build

FROM node:22 AS production
WORKDIR /app

RUN npm install -g pnpm@10.15.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=1 CMD curl -S --fail http://localhost:8080/health

EXPOSE 8080
ENTRYPOINT ["pnpm", "start"]
