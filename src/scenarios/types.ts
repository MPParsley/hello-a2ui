import type { ActionPayload } from '@a2ui/web_core';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';

export const CATALOG_ID = basicCatalog.id;

export type A2uiMessage = Record<string, unknown>;
export type Component = Record<string, unknown> & { id: string; component: string };

/** What a scenario (our simulated agent) can do with the client. */
export interface AgentContext {
  /** Send A2UI messages from the agent to the client. */
  send(...messages: A2uiMessage[]): void;
  /** Wait, to mimic network latency or token streaming. Rejects when the scenario is stopped. */
  sleep(ms: number): Promise<void>;
}

export interface Scenario {
  id: string;
  title: string;
  /** One-line explanation shown above the surface. */
  blurb: string;
  /** Components/features this scenario shows. */
  features: string[];
  start(ctx: AgentContext): void | Promise<void>;
  onAction?(action: ActionPayload, ctx: AgentContext): void | Promise<void>;
}

// ---- Small helpers so the scenario definitions stay readable ----

export const path = (p: string) => ({ '@path': p });
export const call = (fn: string, args: Record<string, unknown>) => ({ '@call': fn, args });
export const fmt = (template: string) => call('formatString', { value: template });

export function createSurface(
  surfaceId: string,
  components: Component[],
  dataModel?: Record<string, unknown>,
): A2uiMessage {
  return {
    version: '1.0',
    createSurface: { surfaceId, catalogId: CATALOG_ID, components, ...(dataModel ? { dataModel } : {}) },
  };
}

export function updateComponents(surfaceId: string, components: Component[]): A2uiMessage {
  return { version: '1.0', updateComponents: { surfaceId, components } };
}

export function updateDataModel(surfaceId: string, p: string, value: unknown): A2uiMessage {
  return { version: '1.0', updateDataModel: { surfaceId, path: p, value } };
}

export function deleteSurface(surfaceId: string): A2uiMessage {
  return { version: '1.0', deleteSurface: { surfaceId } };
}

/** A Text component. */
export const text = (id: string, value: unknown, variant?: 'body' | 'caption'): Component => ({
  id,
  component: 'Text',
  text: value,
  ...(variant ? { variant } : {}),
});

/** A Button with a Text label; adds two components. */
export function button(
  id: string,
  label: string,
  action: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): Component[] {
  return [
    { id, component: 'Button', child: `${id}_label`, action, ...extra },
    text(`${id}_label`, label),
  ];
}

export const event = (name: string, context: Record<string, unknown> = {}) => ({ event: { name, context } });
