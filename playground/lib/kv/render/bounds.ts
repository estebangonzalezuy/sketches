import type { Layer } from '../model';
import type { Rect } from './ink';
import { lockupBounds, shapeBounds } from './shapes';
import { textBounds } from './text';
import { headlineBounds } from './type';

// ---------------------------------------------------------------- bounds

export function layerBounds(l: Layer): Rect {
  switch (l.type) {
    case 'block':
    case 'bracket':
    case 'grid':
    case 'image':
    case 'media':
      return { x: l.x, y: l.y, w: l.w, h: l.h };
    case 'headline':
      return headlineBounds(l);
    case 'text':
      return textBounds(l);
    case 'shape':
      return shapeBounds(l);
    case 'lockup':
      return lockupBounds(l);
  }
}
