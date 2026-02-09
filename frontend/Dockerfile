# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
# Use same-origin API in Docker (nginx proxies /api to backend)
ENV VITE_API_URL=
RUN --mount=type=cache,target=/root/.npm \
    npm run build


FROM nginx:1.27-alpine AS runner

# Custom nginx config: SPA + /api proxy to backend
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

