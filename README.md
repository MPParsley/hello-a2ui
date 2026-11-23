# Hello A2UI

Minimale demo van [A2UI](https://a2ui.org) (Agent-to-User Interface), gepubliceerd op GitHub Pages.

Een gesimuleerde agent (`src/agent.ts`) stuurt A2UI v1.0-berichten (`createSurface`,
`updateDataModel`). De client (`src/main.ts`) verwerkt ze met de `MessageProcessor` uit
`@a2ui/web_core` en rendert ze met `<a2ui-surface>` uit `@a2ui/lit`. Klik je op
**Zeg hallo**, dan gaat een `action`-event terug naar de agent, die antwoordt met een
`updateDataModel`. Alle berichten zie je live in het rechterpaneel.

Er is geen backend en geen LLM: de agent is hard-coded, zodat alles statisch op Pages draait.
In een echte toepassing komen deze berichten van een LLM-agent (bv. via A2A of SSE).

## Lokaal draaien

```bash
npm install
npm run dev
```

## Deploy

`.github/workflows/deploy.yml` bouwt met Vite en publiceert `dist/` naar GitHub Pages
bij elke push. Eenmalig instellen: **Settings → Pages → Source: GitHub Actions**.
