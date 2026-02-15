/**
 * Résolution des feature flags :
 *   1. window.__APP_CONFIG__ injecté par nginx au runtime (déploiement Docker)
 *   2. Valeur codée en dur ci-dessous (développement local)
 *
 * Pour le dev local, modifiez directement les valeurs par défaut.
 * En production, configurez les variables d'environnement dans docker-compose.yml.
 */
declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string;
      USE_MOCK?: boolean;
      USE_ADDRESS_AUTOCOMPLETE?: boolean;
      USE_DEMO_CREDENTIALS?: boolean;
    };
  }
}

const cfg = window.__APP_CONFIG__ ?? {};

/** true = données mockées, false = appels API réels (http://localhost:8080) */
export const USE_MOCK: boolean = cfg.USE_MOCK ?? false;

/** true = autocomplete d'adresse via Nominatim/OpenStreetMap */
export const USE_ADDRESS_AUTOCOMPLETE: boolean = cfg.USE_ADDRESS_AUTOCOMPLETE ?? true;

/** true = bouton "Démo" visible sur la page de login */
export const USE_DEMO_CREDENTIALS: boolean = cfg.USE_DEMO_CREDENTIALS ?? false;
