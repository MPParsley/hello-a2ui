import {
  type Component,
  type Scenario,
  button,
  call,
  createSurface,
  deleteSurface,
  event,
  fmt,
  path,
  text,
  updateComponents,
} from './types';

const S = 'booking';

const required = (p: string, message: string) => ({ condition: call('required', { value: path(p) }), message });

function formComponents(): Component[] {
  return [
    { id: 'root', component: 'Card', child: 'form' },
    {
      id: 'form',
      component: 'Column',
      children: ['title', 'sub', 'who', 'when', 'guests', 'guests_txt', 'menu', 'diet', 'notes', 'news', 'div', 'footer'],
    },
    text('title', '### 🍽️ Tafel reserveren'),
    text('sub', 'Alle velden zijn gebonden aan het datamodel; validatie gebeurt client-side via @checks.', 'caption'),

    { id: 'who', component: 'Row', children: ['name', 'email'] },
    {
      id: 'name',
      component: 'TextField',
      label: 'Naam',
      placeholder: 'Voor- en achternaam',
      value: path('/booking/name'),
      weight: 1,
      '@checks': [required('/booking/name', 'Naam is verplicht.')],
    },
    {
      id: 'email',
      component: 'TextField',
      label: 'E-mail',
      placeholder: 'naam@voorbeeld.be',
      value: path('/booking/email'),
      weight: 1,
      '@checks': [
        required('/booking/email', 'E-mail is verplicht.'),
        { condition: call('email', { value: path('/booking/email') }), message: 'Dit is geen geldig e-mailadres.' },
      ],
    },

    { id: 'when', component: 'Row', children: ['date', 'time'] },
    {
      id: 'date',
      component: 'DateTimeInput',
      label: 'Datum',
      enableDate: true,
      value: path('/booking/date'),
      min: path('/today'),
      weight: 1,
    },
    {
      id: 'time',
      component: 'DateTimeInput',
      label: 'Uur',
      enableTime: true,
      value: path('/booking/time'),
      weight: 1,
    },

    {
      id: 'guests',
      component: 'Slider',
      label: 'Aantal personen',
      min: 1,
      max: 12,
      value: path('/booking/guests'),
      '@checks': [
        {
          condition: call('numeric', { value: path('/booking/guests'), max: 8 }),
          message: 'Vanaf 9 personen: bel ons even voor een groepsreservatie.',
        },
      ],
    },
    text(
      'guests_txt',
      call('pluralize', {
        value: path('/booking/guests'),
        one: 'Tafel voor 1 persoon',
        other: fmt('Tafel voor ${/booking/guests} personen'),
      }),
      'caption',
    ),

    {
      id: 'menu',
      component: 'ChoicePicker',
      label: 'Menu',
      variant: 'mutuallyExclusive',
      value: path('/booking/menu'),
      options: [
        { label: 'À la carte', value: 'carte' },
        { label: 'Lunchmenu (3 gangen)', value: 'lunch' },
        { label: 'Chef’s tasting (7 gangen)', value: 'tasting' },
      ],
    },
    {
      id: 'diet',
      component: 'ChoicePicker',
      label: 'Dieetwensen',
      variant: 'multipleSelection',
      displayStyle: 'chips',
      value: path('/booking/diet'),
      options: [
        { label: 'Vegetarisch', value: 'veggie' },
        { label: 'Veganistisch', value: 'vegan' },
        { label: 'Glutenvrij', value: 'gluten' },
        { label: 'Lactosevrij', value: 'lactose' },
        { label: 'Notenallergie', value: 'nuts' },
      ],
    },
    {
      id: 'notes',
      component: 'TextField',
      label: 'Opmerkingen',
      variant: 'longText',
      placeholder: 'Verjaardag, kinderstoel, …',
      value: path('/booking/notes'),
    },
    { id: 'news', component: 'CheckBox', label: 'Hou me op de hoogte van nieuwe menu’s', value: path('/booking/newsletter') },
    { id: 'div', component: 'Divider' },
    { id: 'footer', component: 'Row', justify: 'end', children: ['submit'] },
    ...button('submit', 'Reserveer', event('book', { booking: path('/booking') }), {
      variant: 'primary',
      '@checks': [
        required('/booking/name', 'Naam ontbreekt.'),
        { condition: call('email', { value: path('/booking/email') }), message: 'E-mail ongeldig.' },
        required('/booking/date', 'Kies een datum.'),
        { condition: call('numeric', { value: path('/booking/guests'), max: 8 }), message: 'Te veel personen.' },
      ],
    }),
  ];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const MENU: Record<string, string> = { carte: 'À la carte', lunch: 'Lunchmenu', tasting: 'Chef’s tasting' };

export const form: Scenario = {
  id: 'form',
  title: 'Formulier',
  blurb: 'Invoercomponenten met two-way binding, validatie en een agent die het formulier vervangt door een bevestiging.',
  features: ['TextField', 'DateTimeInput', 'Slider', 'ChoicePicker', 'CheckBox', '@checks', 'pluralize', 'formatString', 'updateComponents'],
  start(ctx) {
    ctx.send(
      createSurface(S, formComponents(), {
        today: today(),
        booking: { name: '', email: '', date: '', time: '19:30', guests: 2, menu: ['carte'], diet: [], notes: '', newsletter: false },
      }),
    );
  },
  async onAction(action, ctx) {
    if (action.name === 'reset') {
      ctx.send(deleteSurface(S));
      return this.start(ctx);
    }
    if (action.name !== 'book') return;
    const b = (action.context?.booking ?? {}) as Record<string, any>;
    await ctx.sleep(400);
    const diet = (b.diet ?? []).length ? `Dieet: ${(b.diet as string[]).join(', ')}` : 'Geen dieetwensen';
    ctx.send(
      updateComponents(S, [
        { id: 'root', component: 'Card', child: 'done' },
        { id: 'done', component: 'Column', children: ['ok_row', 'ok_body', 'ok_list', 'ok_actions'] },
        { id: 'ok_row', component: 'Row', align: 'center', children: ['ok_icon', 'ok_title'] },
        { id: 'ok_icon', component: 'Icon', name: 'check' },
        text('ok_title', '### Reservatie bevestigd'),
        text('ok_body', `Bedankt **${b.name}**! We sturen een bevestiging naar ${b.email}.`),
        {
          id: 'ok_list',
          component: 'Column',
          children: ['l1', 'l2', 'l3', 'l4'],
        },
        text('l1', fmt('📅 ${formatDate(value: ${/booking/date}, format: \'EEEE d MMMM yyyy\')} om ${/booking/time}')),
        text('l2', `👥 ${b.guests} ${b.guests === 1 ? 'persoon' : 'personen'}`),
        text('l3', `🍴 ${MENU[(b.menu ?? [])[0]] ?? 'Geen menu gekozen'}`),
        text('l4', `🥗 ${diet}`, 'caption'),
        { id: 'ok_actions', component: 'Row', justify: 'end', children: ['again'] },
        ...button('again', 'Nieuwe reservatie', event('reset')),
      ]),
    );
  },
};
