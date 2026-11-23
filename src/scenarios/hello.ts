import { type Scenario, button, createSurface, event, path, text, updateDataModel } from './types';

const S = 'hello';
let greetings = 0;

export const hello: Scenario = {
  id: 'hello',
  title: 'Hallo',
  blurb: 'De basis: een agent beschrijft een kaart in JSON, de client rendert ze en stuurt acties terug.',
  features: ['Card', 'Column', 'Row', 'Text (markdown)', 'TextField', 'Button', 'Divider', 'data binding', 'openUrl'],
  start(ctx) {
    greetings = 0;
    ctx.send(
      createSurface(
        S,
        [
          { id: 'root', component: 'Card', child: 'content' },
          { id: 'content', component: 'Column', children: ['title', 'intro', 'name', 'actions', 'div', 'reply'] },
          text('title', '## Hallo, A2UI 👋'),
          text('intro', 'Deze kaart is volledig beschreven in JSON door de agent.', 'caption'),
          { id: 'name', component: 'TextField', label: 'Je naam', placeholder: 'bv. Ada Lovelace', value: path('/name') },
          { id: 'actions', component: 'Row', children: ['greet', 'docs'] },
          ...button('greet', 'Zeg hallo', event('greet', { name: path('/name') }), { variant: 'primary' }),
          ...button(
            'docs',
            'Meer over A2UI',
            { functionCall: { '@call': 'openUrl', args: { url: 'https://a2ui.org' } } },
            { variant: 'borderless' },
          ),
          { id: 'div', component: 'Divider' },
          text('reply', path('/reply')),
        ],
        { name: '', reply: 'Vul je naam in en klik op de knop.' },
      ),
    );
  },
  async onAction(action, ctx) {
    if (action.name !== 'greet') return;
    await ctx.sleep(300);
    const name = String(action.context?.name ?? '').trim();
    greetings += 1;
    ctx.send(
      updateDataModel(
        S,
        '/reply',
        name
          ? `Hallo, **${name}**! Dit antwoord kwam van de agent via \`updateDataModel\` (#${greetings}).`
          : 'Ik ken je naam nog niet — vul ze eerst in. 🙂',
      ),
    );
  },
};
