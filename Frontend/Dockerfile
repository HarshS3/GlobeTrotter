# Frontend Dockerfile (multi-stage build)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Lightweight nginx serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Simple security headers
RUN sed -i '/server_name  localhost;/a add_header X-Content-Type-Options "nosniff";\nadd_header X-Frame-Options "DENY";' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]