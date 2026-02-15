# ── Stage 1 : build Angular ───────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production


# ── Stage 2 : serve avec nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Template nginx : généré dynamiquement au démarrage via sed dans entrypoint.sh
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Fichiers buildés
COPY --from=builder /app/dist/immofds-front/browser /usr/share/nginx/html

# Script d'entrée : génère nginx.conf + env.js depuis les variables d'environnement
# sed supprime les éventuels CRLF Windows (\r) pour garantir l'exécution sous Linux
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
