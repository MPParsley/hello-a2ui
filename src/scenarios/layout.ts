import { type Component, type Scenario, button, createSurface, event, path, text, updateDataModel } from './types';

const S = 'layout';

const ICONS = [
  'home', 'search', 'settings', 'person', 'mail', 'call', 'calendarToday', 'locationOn',
  'favorite', 'star', 'share', 'notifications', 'photo', 'camera', 'lock', 'payment',
];

function iconGrid(): Component[] {
  const rows: Component[] = [];
  const out: Component[] = [];
  for (let r = 0; r < ICONS.length / 8; r++) {
    const ids = ICONS.slice(r * 8, r * 8 + 8).map((n) => `ic_${n}`);
    rows.push({ id: `ic_row${r}`, component: 'Row', justify: 'spaceBetween', children: ids });
    for (const n of ICONS.slice(r * 8, r * 8 + 8)) out.push({ id: `ic_${n}`, component: 'Icon', name: n });
  }
  return [{ id: 'icons', component: 'Column', children: rows.map((r) => r.id) }, ...rows, ...out];
}

const stat = (id: string, label: string, value: string): Component[] => [
  { id, component: 'Card', weight: 1, child: `${id}_col` },
  { id: `${id}_col`, component: 'Column', align: 'center', children: [`${id}_v`, `${id}_l`] },
  text(`${id}_v`, `## ${value}`),
  text(`${id}_l`, label, 'caption'),
];

export const layout: Scenario = {
  id: 'layout',
  title: 'Layout',
  blurb: 'Containers om schermen op te bouwen: Row/Column met justify, align en weight, Tabs, Modal, Divider en Icons.',
  features: ['Row', 'Column', 'weight', 'justify/align', 'Tabs', 'Modal', 'Divider (vertical)', 'Icon'],
  start(ctx) {
    ctx.send(
      createSurface(
        S,
        [
          { id: 'root', component: 'Column', children: ['stats', 'tabs'] },

          // Three equal-width cards thanks to weight: 1
          { id: 'stats', component: 'Row', children: ['s1', 's2', 's3'] },
          ...stat('s1', 'Gebruikers', '1.284'),
          ...stat('s2', 'Conversie', '3,7%'),
          ...stat('s3', 'NPS', '+42'),

          {
            id: 'tabs',
            component: 'Tabs',
            tabs: [
              { title: 'Weights', child: 'tab_weights' },
              { title: 'Uitlijning', child: 'tab_align' },
              { title: 'Iconen', child: 'tab_icons' },
              { title: 'Modal', child: 'tab_modal' },
            ],
          },

          // Tab 1: weights
          { id: 'tab_weights', component: 'Column', children: ['w_info', 'w_row'] },
          text('w_info', 'weight werkt als CSS flex-grow — hier 1 : 2 : 1, met verticale dividers.', 'caption'),
          { id: 'w_row', component: 'Row', children: ['w1', 'v1', 'w2', 'v2', 'w3'] },
          { id: 'w1', component: 'Card', weight: 1, child: 'w1t' },
          text('w1t', 'weight 1'),
          { id: 'v1', component: 'Divider', axis: 'vertical' },
          { id: 'w2', component: 'Card', weight: 2, child: 'w2t' },
          text('w2t', '**weight 2** — neemt dubbel zoveel ruimte'),
          { id: 'v2', component: 'Divider', axis: 'vertical' },
          { id: 'w3', component: 'Card', weight: 1, child: 'w3t' },
          text('w3t', 'weight 1'),

          // Tab 2: justify
          { id: 'tab_align', component: 'Column', children: ['j1l', 'j1', 'j2l', 'j2', 'j3l', 'j3'] },
          text('j1l', 'justify: start', 'caption'),
          { id: 'j1', component: 'Row', justify: 'start', children: ['j1a', 'j1b', 'j1c'] },
          text('j2l', 'justify: center', 'caption'),
          { id: 'j2', component: 'Row', justify: 'center', children: ['j2a', 'j2b', 'j2c'] },
          text('j3l', 'justify: spaceBetween', 'caption'),
          { id: 'j3', component: 'Row', justify: 'spaceBetween', children: ['j3a', 'j3b', 'j3c'] },
          ...['j1', 'j2', 'j3'].flatMap((j) =>
            ['a', 'b', 'c'].map((x): Component => ({ id: `${j}${x}`, component: 'Icon', name: 'star' })),
          ),

          // Tab 3: icons
          { id: 'tab_icons', component: 'Column', children: ['ic_info', 'icons'] },
          text('ic_info', 'Een greep uit de ingebouwde iconen van de basiscatalogus.', 'caption'),
          ...iconGrid(),

          // Tab 4: modal
          { id: 'tab_modal', component: 'Column', children: ['m_info', 'modal'] },
          text('m_info', 'Een Modal heeft een trigger en content. De knop in de modal stuurt een actie naar de agent.', 'caption'),
          { id: 'modal', component: 'Modal', trigger: 'm_open', content: 'm_content' },
          ...button('m_open', 'Account verwijderen…', event('noop')),
          { id: 'm_content', component: 'Column', children: ['m_row', 'm_text', 'm_confirm', 'm_result'] },
          { id: 'm_row', component: 'Row', align: 'center', children: ['m_icon', 'm_title'] },
          { id: 'm_icon', component: 'Icon', name: 'warning' },
          text('m_title', '### Ben je zeker?'),
          text('m_text', 'Dit is een demo: er wordt niets verwijderd.'),
          ...button('m_confirm', 'Ja, verwijder', event('confirm'), { variant: 'primary' }),
          text('m_result', path('/result')),
        ],
        { result: '' },
      ),
    );
  },
  async onAction(action, ctx) {
    if (action.name !== 'confirm') return;
    await ctx.sleep(300);
    ctx.send(updateDataModel(S, '/result', `✅ De agent ontving \`${action.name}\` van \`${action.sourceComponentId}\`.`));
  },
};
