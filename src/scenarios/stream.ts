import {
  type Component,
  type Scenario,
  button,
  call,
  createSurface,
  deleteSurface,
  event,
  path,
  text,
  updateComponents,
  updateDataModel,
} from './types';

const S = 'trip';

/**
 * Shows how an agent can build a UI progressively: first a skeleton, then
 * components and data arrive piece by piece (like an LLM streaming tokens).
 */
export const stream: Scenario = {
  id: 'stream',
  title: 'Streaming',
  blurb: 'De agent bouwt de UI stap voor stap op met updateComponents en updateDataModel — zoals een LLM die output streamt.',
  features: ['progressieve rendering', 'updateComponents', 'updateDataModel', 'deleteSurface', 'formatDate', 'formatNumber'],
  start(ctx) {
    ctx.send(
      createSurface(S, [
        { id: 'root', component: 'Card', child: 'col' },
        { id: 'col', component: 'Column', children: ['intro', 'go'] },
        text('intro', '### ✈️ Reisplanner\nVraag de agent om een city trip te plannen en kijk hoe de UI wordt opgebouwd.'),
        ...button('go', 'Plan 3 dagen Lissabon', event('plan'), { variant: 'primary' }),
      ]),
    );
  },
  async onAction(action, ctx) {
    if (action.name === 'restart') {
      ctx.send(deleteSurface(S));
      await ctx.sleep(300);
      return this.start(ctx);
    }
    if (action.name !== 'plan') return;

    // 1. Skeleton with a status line.
    ctx.send(
      updateComponents(S, [
        { id: 'col', component: 'Column', children: ['title', 'status'] },
        text('title', '### ✈️ Lissabon — 3 dagen'),
        text('status', path('/status'), 'caption'),
      ]),
      updateDataModel(S, '/status', '⏳ Agent denkt na…'),
    );
    await ctx.sleep(900);

    // 2. Trip facts arrive as data.
    const start = new Date();
    start.setDate(start.getDate() + 14);
    ctx.send(
      updateDataModel(S, '/trip', { start: start.toISOString().slice(0, 10), budget: 1250, temp: 22 }),
      updateComponents(S, [
        { id: 'col', component: 'Column', children: ['title', 'status', 'facts'] },
        { id: 'facts', component: 'Row', children: ['f1', 'f2', 'f3'] },
        ...fact('f1', 'calendarToday', call('formatDate', { value: path('/trip/start'), format: 'd MMM yyyy' })),
        ...fact('f2', 'payment', call('formatCurrency', { value: path('/trip/budget'), currency: 'EUR', decimals: 0 })),
        ...fact('f3', 'info', call('formatString', { value: '${/trip/temp} °C' })),
      ]),
      updateDataModel(S, '/status', '⏳ Dagprogramma samenstellen…'),
    );
    await ctx.sleep(700);

    // 3. Days stream in one by one.
    const days = [
      { title: 'Dag 1 · Alfama', items: ['Castelo de São Jorge', 'Tram 28', 'Fado in de avond'] },
      { title: 'Dag 2 · Belém', items: ['Mosteiro dos Jerónimos', 'Pastéis de Belém', 'MAAT museum'] },
      { title: 'Dag 3 · Sintra', items: ['Palácio da Pena', 'Quinta da Regaleira', 'Zonsondergang bij Cabo da Roca'] },
    ];
    ctx.send(
      updateComponents(S, [
        { id: 'item', component: 'Row', align: 'center', children: ['item_i', 'item_t'] },
        { id: 'item_i', component: 'Icon', name: 'locationOn' },
        text('item_t', path('name')),
      ]),
    );
    const dayIds: string[] = [];
    for (let i = 0; i < days.length; i++) {
      const id = `day${i}`;
      dayIds.push(id);
      ctx.send(
        updateDataModel(S, `/days/${i}`, { ...days[i], items: days[i].items.map((name) => ({ name })) }),
        updateComponents(S, [
          { id: 'col', component: 'Column', children: ['title', 'status', 'facts', ...dayIds] },
          { id, component: 'Card', child: `${id}_c` },
          { id: `${id}_c`, component: 'Column', children: [`${id}_t`, `${id}_l`] },
          text(`${id}_t`, call('formatString', { value: `**\${/days/${i}/title}**` })),
          { id: `${id}_l`, component: 'List', children: { path: `/days/${i}/items`, componentId: 'item' } },
        ]),
      );
      await ctx.sleep(800);
    }

    // 4. Done.
    ctx.send(
      updateDataModel(S, '/status', '✅ Klaar — 3 dagen, 9 activiteiten.'),
      updateComponents(S, [
        { id: 'col', component: 'Column', children: ['title', 'status', 'facts', ...dayIds, 'actions'] },
        { id: 'actions', component: 'Row', justify: 'end', children: ['restart'] },
        ...button('restart', 'Opnieuw', event('restart')),
      ]),
    );
  },
};

function fact(id: string, icon: string, value: unknown): Component[] {
  return [
    { id, component: 'Card', weight: 1, child: `${id}_r` },
    { id: `${id}_r`, component: 'Row', align: 'center', children: [`${id}_i`, `${id}_t`] },
    { id: `${id}_i`, component: 'Icon', name: icon },
    text(`${id}_t`, value),
  ];
}
