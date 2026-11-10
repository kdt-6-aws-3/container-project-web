# Stage 1: 빌드
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.js ./
COPY public/ public/
COPY src/ src/
RUN npm run build

# Stage 2: 서빙
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.version="0.0.2" \
      org.opencontainers.image.title="container-project-web"
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
ENV WAS_HOST=was
ENV WAS_PORT=8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/index.html || exit 1
