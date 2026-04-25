# Build Stage
FROM node:20-slim AS build

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build || echo "Skip build if no script"

# Production Stage
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Only copy what's strictly necessary
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
# If build script existed, we'd copy /dist

# Non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs agentic
USER agentic

EXPOSE 4000

CMD ["npx", "ts-node", "src/index.ts"]