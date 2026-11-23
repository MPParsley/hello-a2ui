import { type Scenario, button, call, createSurface, event, fmt, path, text, updateDataModel } from './types';

const S = 'shop';

const PRODUCTS = [
  { id: 'espresso', name: 'Espresso', desc: 'Dubbele shot, single origin', price: 2.8, rating: 5 },
  { id: 'croissant', name: 'Croissant', desc: 'Roomboter, vers gebakken', price: 2.2, rating: 4 },
  { id: 'thee', name: 'Matcha latte', desc: 'Ceremoniële matcha, havermelk', price: 4.5, rating: 4 },
  { id: 'taart', name: 'Frambozentaart', desc: 'Huisgemaakt, per stuk', price: 4.9, rating: 5 },
  { id: 'bagel', name: 'Bagel zalm', desc: 'Roomkaas, kappertjes, dille', price: 7.5, rating: 4 },
  { id: 'smoothie', name: 'Bessen-smoothie', desc: 'Blauwe bes, banaan, yoghurt', price: 5.2, rating: 3 },
];

type Line = { id: string; name: string; qty: number; price: number; total: number };
let cart: Line[] = [];

function cartMessages() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const total = cart.reduce((n, l) => n + l.total, 0);
  return [
    updateDataModel(S, '/cart', cart),
    updateDataModel(S, '/count', count),
    updateDataModel(S, '/total', Math.round(total * 100) / 100),
  ];
}

export const shop: Scenario = {
  id: 'shop',
  title: 'Lijsten & data',
  blurb: 'Een List met een template die per item uit het datamodel wordt herhaald. Acties dragen item-context mee naar de agent.',
  features: ['List (template)', 'relatieve paden', 'Image', 'Icon', 'formatCurrency', 'pluralize', 'Tabs', 'updateDataModel'],
  start(ctx) {
    cart = [];
    ctx.send(
      createSurface(
        S,
        [
          { id: 'root', component: 'Column', children: ['header', 'status', 'tabs'] },
          text('status', path('/status'), 'caption'),
          { id: 'header', component: 'Row', align: 'center', justify: 'spaceBetween', children: ['title', 'badge'] },
          text('title', '### ☕ Koffiebar'),
          { id: 'badge', component: 'Row', align: 'center', children: ['cart_icon', 'cart_count'] },
          { id: 'cart_icon', component: 'Icon', name: 'shoppingCart' },
          text(
            'cart_count',
            call('pluralize', { value: path('/count'), zero: 'leeg', one: '1 item', other: fmt('${/count} items') }),
            'caption',
          ),
          {
            id: 'tabs',
            component: 'Tabs',
            tabs: [
              { title: 'Menukaart', child: 'menu_list' },
              { title: fmt('Winkelmand (${/count})'), child: 'cart_col' },
            ],
          },

          // --- Menu: one template, repeated for every item in /products ---
          { id: 'menu_list', component: 'List', children: { path: '/products', componentId: 'p_card' } },
          { id: 'p_card', component: 'Card', child: 'p_row' },
          { id: 'p_row', component: 'Row', align: 'center', children: ['p_img', 'p_info', 'p_buy'] },
          { id: 'p_img', component: 'Image', url: path('img'), description: path('name'), variant: 'avatar' },
          { id: 'p_info', component: 'Column', weight: 1, children: ['p_name', 'p_desc', 'p_price'] },
          text('p_name', fmt('**${name}**')),
          text('p_desc', path('desc'), 'caption'),
          text('p_price', call('formatCurrency', { value: path('price'), currency: 'EUR' })),
          ...button('p_buy', 'Toevoegen', event('add', { id: path('id') }), { variant: 'primary' }),

          // --- Cart ---
          { id: 'cart_col', component: 'Column', children: ['cart_list', 'cart_div', 'cart_total', 'cart_actions'] },
          { id: 'cart_list', component: 'List', children: { path: '/cart', componentId: 'c_row' } },
          { id: 'c_row', component: 'Row', align: 'center', justify: 'spaceBetween', children: ['c_name', 'c_total', 'c_del'] },
          { ...text('c_name', fmt('${qty} × ${name}')), weight: 1 },
          text('c_total', call('formatCurrency', { value: path('total'), currency: 'EUR' })),
          { id: 'c_del', component: 'Button', variant: 'borderless', child: 'c_del_icon', action: event('remove', { id: path('id') }) },
          { id: 'c_del_icon', component: 'Icon', name: 'delete' },
          { id: 'cart_div', component: 'Divider' },
          text('cart_total', fmt('**Totaal: ${formatCurrency(value: ${/total}, currency: \'EUR\')}**')),
          { id: 'cart_actions', component: 'Row', justify: 'end', children: ['clear', 'checkout'] },
          ...button('clear', 'Leegmaken', event('clear'), { variant: 'borderless' }),
          ...button('checkout', 'Afrekenen', event('checkout', { total: path('/total') }), {
            variant: 'primary',
            '@checks': [{ condition: call('numeric', { value: path('/count'), min: 1 }), message: 'Je winkelmand is leeg.' }],
          }),
        ],
        { products: PRODUCTS.map((p) => ({ ...p, img: `img/${p.id}.svg` })), cart: [], count: 0, total: 0, status: 'Kies iets van de menukaart.' },
      ),
    );
  },
  async onAction(action, ctx) {
    const id = String(action.context?.id ?? '');
    switch (action.name) {
      case 'add': {
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) return;
        const line = cart.find((l) => l.id === id);
        if (line) line.qty += 1;
        else cart.push({ id, name: p.name, qty: 1, price: p.price, total: 0 });
        break;
      }
      case 'remove':
        cart = cart.filter((l) => l.id !== id);
        break;
      case 'clear':
        cart = [];
        break;
      case 'checkout':
        await ctx.sleep(400);
        cart = [];
        ctx.send(
          ...cartMessages(),
          updateDataModel(S, '/status', `✅ Bestelling geplaatst (€ ${Number(action.context?.total ?? 0).toFixed(2)}). Smakelijk!`),
        );
        return;
      default:
        return;
    }
    cart = cart.map((l) => ({ ...l, total: Math.round(l.qty * l.price * 100) / 100 }));
    await ctx.sleep(150);
    ctx.send(...cartMessages(), updateDataModel(S, '/status', action.name === 'add' ? 'Toegevoegd aan je winkelmand.' : 'Winkelmand bijgewerkt.'));
  },
};
