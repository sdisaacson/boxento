import { LayoutItem } from '@/types';

export const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
export const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

export const createDefaultLayoutItem = (
  widgetId: string,
  index: number,
  colCount: number,
  breakpoint: string
): LayoutItem => {
  if (breakpoint === 'lg' || breakpoint === 'md') {
    const maxItemsPerRow = Math.max(1, Math.floor(colCount / 3));
    const col = index % maxItemsPerRow;
    const row = Math.floor(index / maxItemsPerRow);

    return {
      i: widgetId,
      x: col * 3,
      y: row * 3,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2
    };
  } else if (breakpoint === 'sm') {
    const itemsPerRow = 2;
    const col = index % itemsPerRow;
    const row = Math.floor(index / itemsPerRow);

    return {
      i: widgetId,
      x: col * 3,
      y: row * 3,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2
    };
  } else {
    return {
      i: widgetId,
      x: 0,
      y: index * 2,
      w: 2,
      h: 2,
      minW: 2,
      minH: 2,
      maxW: 2,
      maxH: 2
    };
  }
};
