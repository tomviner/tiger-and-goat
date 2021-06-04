import { atom, selector } from 'recoil';
import { NUM_GOATS } from './Constants';

export const tigersState = atom({
  key: 'tigersState',
  default: [] as number[],
});

export const goatsState = atom({
  key: 'goatsState',
  default: [] as number[],
});

export const numGoatsToPlaceState = atom({
  key: 'numGoatsToPlaceState',
  default: NUM_GOATS,
});

export const possibleMovesState = atom({
  key: 'possibleMovesState',
  default: [] as number[][],
});

export const numGoatsEatenState = selector({
  key: 'numGoatsEatenState',
  get: ({ get }) => {
    const goats = get(goatsState);
    const numGoatsToPlace = get(numGoatsToPlaceState);

    return NUM_GOATS - numGoatsToPlace - goats.length;
  },
});
