import 'material-icons/iconfont/filled.css';
import { Context } from '@a2ui/lit'; // also registers <a2ui-surface>
import { renderMarkdown } from '@a2ui/markdown-it';
import { MessageProcessor, type ActionPayload } from '@a2ui/web_core';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';
import { ContextProvider } from '@lit/context';
import { SCENARIOS } from './scenarios';
import type { A2uiMessage, AgentContext, Scenario } from './scenarios/types';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const nav = $('#nav');
const host = $<HTMLDivElement>('#surface-host');
const log = $<HTMLOListElement>('#log');
const logCount = $('#log-count');
const modelView = $('#model');
const editor = $<HTMLTextAreaElement>('#editor');
const editorErrors = $('#editor-errors');

// Provide a Markdown renderer to all A2UI Text components inside the host.
new ContextProvider(host, { context: Context.markdown, initialValue: renderMarkdown });

// ---------------------------------------------------------------------------
// Session: one MessageProcessor + one simulated agent run.
// ---------------------------------------------------------------------------

interface Session {
  processor: MessageProcessor<any>;
  surfaces: Map<string, any>;
  sent: A2uiMessage[];
  stopped: boolean;
}

let session: Session | undefined;
let current: Scenario | undefined;
let logEntries = 0;

function newSession(onAction: (a: ActionPayload) => void): Session {
  if (session) session.stopped = true;
  host.replaceChildren();
  log.replaceChildren();
  logEntries = 0;
  logCount.textContent = '';
  editorErrors.hidden = true;

  const s: Session = {
    processor: new MessageProcessor([basicCatalog], onAction),
    surfaces: new Map(),
    sent: [],
    stopped: false,
  };
  s.processor.onSurfaceCreated((surface: any) => {
    s.surfaces.set(surface.id, surface);
    const el = document.createElement('a2ui-surface') as HTMLElement & { surface: unknown };
    el.dataset.surfaceId = surface.id;
    el.surface = surface;
    host.append(el);
    surface.onError?.subscribe((err: unknown) => reportError(err));
  });
  s.processor.onSurfaceDeleted((id: string) => {
    s.surfaces.delete(id);
    host.querySelector(`[data-surface-id="${CSS.escape(id)}"]`)?.remove();
  });
  session = s;
  return s;
}

function agentContext(s: Session): AgentContext {
  return {
    send: (...messages) => {
      if (s.stopped) return;
      for (const m of messages) addLog('in', m);
      s.sent.push(...messages);
      s.processor.processMessages(messages as any);
      scheduleModelRefresh();
    },
    sleep: (ms) =>
      new Promise((resolve, reject) => setTimeout(() => (s.stopped ? reject(new Error('stopped')) : resolve()), ms)),
  };
}

function runScenario(sc: Scenario): void {
  current = sc;
  const s = newSession((action) => {
    addLog('out', { action });
    scheduleModelRefresh();
    Promise.resolve(sc.onAction?.call(sc, action, ctx)).catch(ignoreStopped);
  });
  const ctx = agentContext(s);

  $('#sc-title').textContent = sc.title;
  $('#sc-blurb').textContent = sc.blurb;
  $('#sc-features').replaceChildren(
    ...sc.features.map((f) => Object.assign(document.createElement('li'), { textContent: f })),
  );
  for (const a of nav.querySelectorAll('a')) a.setAttribute('aria-current', String(a.dataset.id === sc.id));

  Promise.resolve(sc.start.call(sc, ctx)).catch(ignoreStopped);
}

function ignoreStopped(err: unknown): void {
  if (!(err instanceof Error && err.message === 'stopped')) console.error(err);
}

// ---------------------------------------------------------------------------
// Playground: render arbitrary A2UI messages.
// ---------------------------------------------------------------------------

function runPlayground(json: string): void {
  let messages: unknown;
  try {
    messages = JSON.parse(json);
  } catch (e) {
    showErrors([`JSON-fout: ${(e as Error).message}`]);
    return;
  }
  current = undefined;
  const s = newSession((action) => addLog('out', { action }));
  $('#sc-title').textContent = 'Playground';
  $('#sc-blurb').textContent = 'Jouw eigen A2UI-berichten. Acties worden gelogd, maar er is geen agent die antwoordt.';
  $('#sc-features').replaceChildren();
  for (const a of nav.querySelectorAll('a')) a.setAttribute('aria-current', 'false');

  const list = Array.isArray(messages) ? messages : [messages];
  for (const m of list) addLog('in', m);
  s.sent.push(...(list as A2uiMessage[]));
  const errors = s.processor.processMessagesWithErrors(list);
  for (const e of errors) reportError(e);
  scheduleModelRefresh();
}

function showErrors(lines: string[]): void {
  editorErrors.textContent = lines.join('\n\n');
  editorErrors.hidden = false;
}

/** Renderer errors (unknown components, invalid props, …) go to the log and the playground. */
function reportError(err: unknown): void {
  addLog('error', err);
  const text = JSON.stringify(err, null, 2);
  editorErrors.textContent = editorErrors.hidden ? text : `${editorErrors.textContent}\n\n${text}`;
  editorErrors.hidden = false;
}

function loadCurrentIntoEditor(): void {
  editor.value = JSON.stringify(session?.sent ?? [], null, 2);
}

// ---------------------------------------------------------------------------
// Side panel: log + data model.
// ---------------------------------------------------------------------------

function addLog(dir: 'in' | 'out' | 'error', payload: unknown): void {
  const li = document.createElement('li');
  li.className = dir;
  const head = document.createElement('div');
  head.className = 'dir';
  const kind = Object.keys((payload as object) ?? {}).find((k) => k !== 'version') ?? '';
  const label = { in: 'agent → client', out: 'client → agent', error: 'renderer-fout' }[dir];
  head.textContent = kind ? `${label} · ${kind}` : label;
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(payload, null, 2);
  li.append(head, pre);
  log.prepend(li);
  logEntries += 1;
  logCount.textContent = String(logEntries);
}

let refreshQueued = false;
function scheduleModelRefresh(): void {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    const out: Record<string, unknown> = {};
    for (const [id, surface] of session?.surfaces ?? []) out[id] = surface.dataModel.get('/');
    modelView.textContent = JSON.stringify(out, null, 2);
  });
}
for (const type of ['input', 'change', 'click']) host.addEventListener(type, scheduleModelRefresh, true);

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

for (const sc of SCENARIOS) {
  const a = document.createElement('a');
  a.href = `#${sc.id}`;
  a.dataset.id = sc.id;
  a.textContent = sc.title;
  nav.append(a);
}

function fromHash(): void {
  const id = location.hash.slice(1);
  runScenario(SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]);
}
window.addEventListener('hashchange', fromHash);

$('#reset').addEventListener('click', () => (current ? runScenario(current) : runPlayground(editor.value)));
$('#load').addEventListener('click', loadCurrentIntoEditor);
$('#render').addEventListener('click', () => runPlayground(editor.value));

for (const tab of document.querySelectorAll<HTMLButtonElement>('.side-tabs [role=tab]')) {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view!;
    if (view === 'editor' && !editor.value) loadCurrentIntoEditor();
    for (const t of document.querySelectorAll('.side-tabs [role=tab]')) t.setAttribute('aria-selected', String(t === tab));
    for (const v of document.querySelectorAll<HTMLElement>('.view')) v.hidden = v.dataset.view !== view;
  });
}

fromHash();
