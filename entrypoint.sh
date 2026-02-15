#!/bin/sh
# Génère au démarrage du conteneur :
#   1. /etc/nginx/conf.d/default.conf  — config nginx avec proxy_pass dynamique (résolution interne Docker)
#   2. /usr/share/nginx/html/env.js    — config lue par Angular via window.__APP_CONFIG__
#
# API_URL est utilisée UNIQUEMENT pour configurer le proxy_pass nginx (résolution interne Docker).
# Angular reçoit toujours API_URL="" dans env.js → URLs relatives → nginx proxifie /api/ vers le backend.
# Le navigateur ne connaît jamais http://backend:8080.

NGINX_BACKEND_URL="${API_URL:-http://backend:8080}"
USE_MOCK="${USE_MOCK:-false}"
USE_ADDRESS_AUTOCOMPLETE="${USE_ADDRESS_AUTOCOMPLETE:-true}"
USE_DEMO_CREDENTIALS="${USE_DEMO_CREDENTIALS:-false}"

# 1. Config nginx : injecte l'URL du backend dans proxy_pass
sed "s|NGINX_API_URL|${NGINX_BACKEND_URL}|g" \
    /etc/nginx/templates/nginx.conf.template \
    > /etc/nginx/conf.d/default.conf
echo "nginx.conf generated (proxy_pass=${NGINX_BACKEND_URL})"

# 2. env.js : API_URL="" → Angular génère des URLs relatives (/api/…)
#    nginx les reçoit et les proxifie vers le backend en interne
cat > /usr/share/nginx/html/env.js <<ENVJS
window.__APP_CONFIG__ = {
  API_URL: "",
  USE_MOCK: ${USE_MOCK},
  USE_ADDRESS_AUTOCOMPLETE: ${USE_ADDRESS_AUTOCOMPLETE},
  USE_DEMO_CREDENTIALS: ${USE_DEMO_CREDENTIALS}
};
ENVJS

echo "env.js generated:"
cat /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
