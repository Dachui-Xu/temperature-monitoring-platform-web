FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
# Vite config sets root to `src`, so build output will be in `src/dist`
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/src/dist /usr/share/nginx/html

# Simple SPA fallback to index.html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
