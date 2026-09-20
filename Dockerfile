# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Khai báo DATABASE_URL tạm thời phục vụ cho prisma generate lúc build
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

# Copy dependencies manifest từ backend
COPY backend/package*.json ./

# Cài đặt dependencies
RUN npm ci

# Copy toàn bộ mã nguồn backend
COPY backend/ ./

# Sinh Prisma Client và build ứng dụng NestJS
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy các file cần thiết từ builder sang runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package*.json ./
COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Cấp quyền thực thi cho entrypoint script
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Port mặc định của Backend NestJS
EXPOSE 3000

# Khởi chạy script migrate DB & start NestJS server
ENTRYPOINT ["docker-entrypoint.sh"]