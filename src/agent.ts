/**
 * A tiny, fully client-side "agent".
 *
 * In a real setup these A2UI messages are produced by an LLM-backed agent and
 * streamed to the client (e.g. over A2A, SSE or WebSockets). Here we hard-code
 * them so the demo runs on static GitHub Pages without any backend.
 */
import type { ActionPayload } from '@a2ui/web_core';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';

export const SURFACE_ID = 'hello';

export type A2uiMessage = Record<string, unknown>;

/** The first message: create a surface with components and a data model. */
export function initialMessages(): A2uiMessage[] {
  return [
    {
      version: '1.0',
      createSurface: {
        surfaceId: SURFACE_ID,
        catalogId: basicCatalog.id,
        dataModel: {
          name: '',
          reply: 'Vul je naam in en klik op de knop.',
          count: 0,
        },
        components: [
          { id: 'root', component: 'Card', child: 'content' },
          {
            id: 'content',
            component: 'Column',
            children: ['title', 'intro', 'name_field', 'actions', 'divider', 'reply'],
          },
          { id: 'title', component: 'Text', text: '## Hello, A2UI 👋' },
          {
            id: 'intro',
            component: 'Text',
            variant: 'caption',
            text: 'Deze kaart is volledig beschreven in JSON door de agent.',
          },
          {
            id: 'name_field',
            component: 'TextField',
            label: 'Je naam',
            placeholder: 'bv. Ada Lovelace',
            value: { '@path': '/name' },
          },
          {
            id: 'actions',
            component: 'Row',
            children: ['greet_btn', 'docs_btn'],
          },
          {
            id: 'greet_btn',
            component: 'Button',
            variant: 'primary',
            child: 'greet_label',
            action: {
              event: {
                name: 'greet',
                context: { name: { '@path': '/name' } },
              },
            },
          },
          { id: 'greet_label', component: 'Text', text: 'Zeg hallo' },
          {
            id: 'docs_btn',
            component: 'Button',
            variant: 'borderless',
            child: 'docs_label',
            action: {
              functionCall: {
                '@call': 'openUrl',
                args: { url: 'https://a2ui.org' },
              },
            },
          },
          { id: 'docs_label', component: 'Text', text: 'Meer over A2UI' },
          { id: 'divider', component: 'Divider' },
          { id: 'reply', component: 'Text', text: { '@path': '/reply' } },
        ],
      },
    },
  ];
}

let greetings = 0;

/** React to a user action by sending new A2UI messages back. */
export function handleAction(action: ActionPayload): A2uiMessage[] {
  if (action.name !== 'greet') return [];

  const raw = String(action.context?.name ?? '').trim();
  greetings += 1;
  const reply = raw
    ? `Hallo, **${raw}**! Deze tekst komt van de agent via \`updateDataModel\` (begroeting #${greetings}).`
    : 'Ik ken je naam nog niet — vul ze eerst in. 🙂';

  return [
    {
      version: '1.0',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/reply', value: reply },
    },
    {
      version: '1.0',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/count', value: greetings },
    },
  ];
}

export function resetAgent(): void {
  greetings = 0;
}
