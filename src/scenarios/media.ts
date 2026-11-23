import { type Scenario, createSurface, text } from './types';

const S = 'media';
const MDN = 'https://interactive-examples.mdn.mozilla.net/media';

export const media: Scenario = {
  id: 'media',
  title: 'Media',
  blurb: 'Afbeeldingen in verschillende varianten, plus video en audio met native browser-controls.',
  features: ['Image (header, feature, avatar, icon)', 'fit', 'Video', 'AudioPlayer'],
  start(ctx) {
    ctx.send(
      createSurface(S, [
        { id: 'root', component: 'Column', children: ['hero', 'variants_t', 'variants', 'video_t', 'video', 'audio_t', 'audio'] },
        { id: 'hero', component: 'Image', url: 'img/header.svg', variant: 'header', fit: 'cover', description: 'A2UI media' },

        text('variants_t', '#### Image-varianten'),
        { id: 'variants', component: 'Row', align: 'end', children: ['v1', 'v2', 'v3', 'v4'] },
        { id: 'v1', component: 'Column', weight: 1, children: ['v1i', 'v1t'] },
        { id: 'v1i', component: 'Image', url: 'img/espresso.svg', variant: 'icon' },
        text('v1t', 'icon', 'caption'),
        { id: 'v2', component: 'Column', weight: 1, children: ['v2i', 'v2t'] },
        { id: 'v2i', component: 'Image', url: 'img/croissant.svg', variant: 'avatar' },
        text('v2t', 'avatar', 'caption'),
        { id: 'v3', component: 'Column', weight: 1, children: ['v3i', 'v3t'] },
        { id: 'v3i', component: 'Image', url: 'img/taart.svg', variant: 'smallFeature' },
        text('v3t', 'smallFeature', 'caption'),
        { id: 'v4', component: 'Column', weight: 1, children: ['v4i', 'v4t'] },
        { id: 'v4i', component: 'Image', url: 'img/smoothie.svg', variant: 'mediumFeature' },
        text('v4t', 'mediumFeature', 'caption'),

        text('video_t', '#### Video'),
        { id: 'video', component: 'Video', url: `${MDN}/cc0-videos/flower.mp4`, posterUrl: `${MDN}/examples/flower.jpg` },
        text('audio_t', '#### Audio'),
        { id: 'audio', component: 'AudioPlayer', url: `${MDN}/cc0-audio/t-rex-roar.mp3`, description: 'T-Rex roar (CC0)' },
      ]),
    );
  },
};
