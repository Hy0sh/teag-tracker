# Multi-stage: build the React dashboard, then run the Hono server (TS via tsx).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=build /app/web/dist ./web/dist
EXPOSE 3000
CMD ["npm", "run", "serve"]

# Dev stage: toutes les deps (vite/tsx inclus), sources montées en volume, HMR.
# Ce n'est PAS l'image de prod (qui est le stage `runtime`).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 3000 5173
CMD ["npm", "run", "serve"]
