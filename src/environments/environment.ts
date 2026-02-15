export const environment = {
  production: false,
  // Dev local  → 'http://localhost:8080' (appel direct à l'API, pas de proxy nginx)
  // Docker     → '' (URL relative : le navigateur envoie /api/… à nginx qui proxifie vers backend:8080)
  //              Valeur positionnée via API_URL="" dans le docker-compose.
  get apiBaseUrl(): string {
    return (window as any).__APP_CONFIG__?.API_URL ?? 'http://localhost:8080';
  },
};
