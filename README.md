# ImmoFDS — Frontend

Application Angular pour l'agence immobilière ImmoFDS (Belgique).

## Stack

- **Angular 19** — Standalone Components, Lazy Loading, SPA
- **Tailwind CSS v3** — Utility-first styling
- **SCSS** — Préprocesseur CSS
- **Signals** — Gestion d'état réactive

## Prérequis

- Node.js 22+
- API backend Spring Boot lancée sur `http://localhost:8080`

## Démarrage

```bash
npm install
npx ng serve --host 127.0.0.1 --port 5000
```

Ouvrez `http://127.0.0.1:5000`.

## Build

```bash
npx ng build
```

Les artefacts sont générés dans `dist/immofds-front/browser/`.
