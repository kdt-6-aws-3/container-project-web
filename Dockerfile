# ── 1단계: 빌드 ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY index.html vite.config.js .oxlintrc.json ./
COPY public/ public/
COPY src/ src/

RUN npm run build

# ── 2단계: 실행 ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.version="0.0.2" \
      org.opencontainers.image.title="container-project-web" \
      org.opencontainers.image.description="PetClinic React SPA — nginx static serving"

RUN addgroup -S petclinic && adduser -S petclinic -G petclinic

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

RUN chown -R petclinic:petclinic /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

ENV WAS_HOST=was
ENV WAS_PORT=8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/index.html || exit 1

CMD ["/bin/sh", "-c", "envsubst '${WAS_HOST} ${WAS_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
