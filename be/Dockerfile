FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and Prisma engine
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build NestJS app
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

# Runtime deps for Prisma query engine
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Start script that runs migrations then starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
