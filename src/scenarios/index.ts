import { form } from './form';
import { hello } from './hello';
import { layout } from './layout';
import { media } from './media';
import { shop } from './shop';
import { stream } from './stream';
import type { Scenario } from './types';

export const SCENARIOS: Scenario[] = [hello, form, shop, layout, stream, media];
