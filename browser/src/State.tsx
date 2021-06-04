import { atom } from 'recoil';

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
  default: 20,
});
