# syntax=docker/dockerfile:1
# 빌드 예시 (K8s 노드가 amd64인 경우, ARM 머신에서 빌드할 때 필수):
#   docker buildx build --platform linux/amd64 --build-arg VERSION=0.0.2 -t <image>:<tag> .
ARG VERSION=0.0.2

# Stage 1: 빌드
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
COPY index.html vite.config.js ./
COPY public/ public/
COPY src/ src/
RUN npm run build

# Stage 2: 서빙
# non-root(UID 101) + 8080 포트로 동작하는 공식 nginx 이미지
# 운영에서는 stable-alpine 대신 구체적인 버전 태그로 고정 권장 (예: 1.xx.x-alpine)
FROM nginxinc/nginx-unprivileged:stable-alpine
ARG VERSION

LABEL org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="container-project-web"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 이미지 기본 USER(101)를 숫자로 명시 → runAsNonRoot 검증 통과
USER 101
EXPOSE 8080

ENV WAS_HOST=was \
    WAS_PORT=8080

# 로컬 docker / compose용. K8s에서는 무시되므로 Deployment의 probe 사용
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1