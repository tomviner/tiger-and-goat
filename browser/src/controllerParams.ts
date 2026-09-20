import { Controller, Controllers, OpponentsInfo } from './api';

export type SideKey = 'goat' | 'tiger';

const controllerFromParam = (
  raw: string | null,
  side: SideKey,
  opponents: OpponentsInfo,
): Controller | null => {
  if (raw === null) return null;
  const value = raw.trim().toLowerCase();
  if (value === 'human') return { type: 'human' };
  if (value === 'jev') return { type: 'jev' };

  const ai = /^ai(?:-(\d+))?$/.exec(value);
  if (ai) {
    const depth = ai[1] ? Number(ai[1]) : opponents.depth.default;
    if (depth >= opponents.depth.min && depth <= opponents.depth.max) {
      return { type: 'ai', depth };
    }
    return null;
  }

  const strategy = opponents.strategies.find(
    (candidate) =>
      candidate.sideName === side && candidate.name.toLowerCase() === value,
  );
  return strategy ? { type: 'strategy', name: strategy.name } : null;
};

export const controllersFromSearch = (
  search: string,
  defaults: Controllers,
  opponents: OpponentsInfo,
): Controllers => {
  const params = new URLSearchParams(search);
  const both = params.get('both');
  return {
    goat:
      controllerFromParam(params.get('goat') ?? both, 'goat', opponents) ??
      defaults.goat,
    tiger:
      controllerFromParam(params.get('tiger') ?? both, 'tiger', opponents) ??
      defaults.tiger,
  };
};

const controllerParam = (controller: Controller): string => {
  if (controller.type === 'ai') return `ai-${controller.depth}`;
  if (controller.type === 'strategy') return controller.name;
  return controller.type;
};

export const urlForControllers = (href: string, controllers: Controllers): string => {
  const url = new URL(href);
  const goat = controllerParam(controllers.goat);
  const tiger = controllerParam(controllers.tiger);
  url.searchParams.delete('both');
  url.searchParams.delete('goat');
  url.searchParams.delete('tiger');
  if (goat === tiger) {
    url.searchParams.set('both', goat);
  } else {
    url.searchParams.set('goat', goat);
    url.searchParams.set('tiger', tiger);
  }
  return url.toString();
};
