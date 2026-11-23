# Hello A2UI

Interactieve showcase van [A2UI](https://a2ui.org) (Agent-to-User Interface), gepubliceerd op GitHub Pages:
**https://mpparsley.github.io/hello-a2ui/**

Met A2UI beschrijft een agent een gebruikersinterface in declaratieve JSON. De client rendert die met
eigen, vertrouwde componenten. Deze demo gebruikt `@a2ui/lit` en `@a2ui/web_core` (protocol v1.0) en de
basiscatalogus.

## Scenario's

| Scenario | Wat je ziet |
|---|---|
| **Hallo** | Card, Column, Row, Text (markdown), TextField, Button, Divider, `openUrl` |
| **Formulier** | TextField, DateTimeInput, Slider, ChoicePicker (radio + chips), CheckBox, validatie met `@checks`, `pluralize`; de agent vervangt het formulier door een bevestiging via `updateComponents` |
| **Lijsten & data** | List met template en relatieve paden, Image, Icon, Tabs, `formatCurrency`; acties met item-context, winkelmand via `updateDataModel` |
| **Layout** | Row/Column met `weight`, `justify`, `align`, Tabs, Modal, verticale Divider, iconen |
| **Streaming** | De agent bouwt de UI stap voor stap op, zoals een LLM die output streamt; `deleteSurface` |
| **Media** | Image-varianten, Video, AudioPlayer |

In het zijpaneel:

- **Berichten** – alle A2UI-berichten tussen agent en client, live.
- **Datamodel** – de client-side staat van elke surface (two-way binding).
- **Playground** – bewerk de JSON van een scenario of schrijf je eigen berichten en render ze. Renderer-fouten
  worden getoond.

Er is geen backend en geen LLM: de agents in `src/scenarios/` zijn hard-coded, zodat alles statisch op Pages draait.
In een echte toepassing komen deze berichten van een LLM-agent (bv. via A2A of SSE).

## Lokaal draaien

```bash
npm install
npm run dev
```

## Structuur

```
src/main.ts            pagina: MessageProcessor, <a2ui-surface>, log, datamodel, playground
src/scenarios/types.ts helpers om A2UI-berichten op te bouwen
src/scenarios/*.ts     één gesimuleerde agent per scenario
public/img/            afbeeldingen voor de demo
```

## Deploy

`.github/workflows/deploy.yml` bouwt met Vite en publiceert `dist/` naar GitHub Pages bij elke push.
