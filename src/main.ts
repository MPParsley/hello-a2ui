import { Context } from '@a2ui/lit'; // also registers <a2ui-surface>
import { renderMarkdown } from '@a2ui/markdown-it';
import { ContextProvider } from '@lit/context';
import { MessageProcessor, type ActionPayload } from '@a2ui/web_core';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';
import { SURFACE_ID, handleAction, initialMessages, resetAgent, type A2uiMessage } from './agent';

const host = document.querySelector<HTMLDivElement>('#surface-host')!;
const log = document.querySelector<HTMLOListElement>('#log')!;
const resetBtn = document.querySelector<HTMLButtonElement>('#reset')!;

// Provide a Markdown renderer to the A2UI Text components inside the host.
new ContextProvider(host, { context: Context.markdown, initialValue: renderMarkdown });

function logEntry(direction: 'agent → client' | 'client → agent', payload: unknown): void {
  const li = document.createElement('li');
  li.className = direction.startsWith('agent') ? 'in' : 'out';
  const label = document.createElement('span');
  label.className = 'dir';
  label.textContent = direction;
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(payload, null, 2);
  li.append(label, pre);
  log.prepend(li);
}

let processor: MessageProcessor<any>;

/** Simulates sending messages from the agent to the client. */
function deliver(messages: A2uiMessage[]): void {
  for (const m of messages) logEntry('agent → client', m);
  processor.processMessages(messages as any);
}

function onAction(action: ActionPayload): void {
  logEntry('client → agent', { action });
  // Small delay to mimic a round-trip to a remote agent.
  setTimeout(() => deliver(handleAction(action)), 250);
}

function start(): void {
  host.replaceChildren();
  log.replaceChildren();
  resetAgent();

  processor = new MessageProcessor([basicCatalog], onAction);
  processor.onSurfaceCreated((surface: any) => {
    if (surface.id !== SURFACE_ID) return;
    const el = document.createElement('a2ui-surface') as HTMLElement & { surface: unknown };
    el.surface = surface;
    host.replaceChildren(el);
  });

  deliver(initialMessages());
}

resetBtn.addEventListener('click', start);
start();
