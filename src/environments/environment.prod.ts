export const environment = {
  production: true,
  // Valeur injectée au runtime par nginx via env.js (entrypoint.sh).
  // En Docker : API_URL="" → URLs relatives, nginx proxifie /api/ vers backend:8080.
  // Fallback '' : même comportement si la variable n'est pas définie.
  get apiBaseUrl(): string {
    return (window as any).__APP_CONFIG__?.API_URL ?? '';
  },
  // Cle Mapbox GL JS -- injectee via __APP_CONFIG__.MAPBOX_TOKEN (entrypoint.sh / env.js).
  get mapboxAccessToken(): string {
    return (window as any).__APP_CONFIG__?.MAPBOX_TOKEN ?? '';
  },
};
