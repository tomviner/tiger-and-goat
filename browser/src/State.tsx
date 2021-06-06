import { List } from 'immutable';
import { atom, selector } from 'recoil';
import { ItemTypes, NUM_GOATS } from './Constants';

export const playerNumState = atom({
  key: 'playerNumState',
  default: 0,
});

export const tigersState = atom({
  key: 'tigersState',
  default: List() as List<number>,
});

export const goatsState = atom({
  key: 'goatsState',
  default: List() as List<number>,
});

export const numGoatsToPlaceState = atom({
  key: 'numGoatsToPlaceState',
  default: NUM_GOATS,
});

export const possibleMovesState = atom({
  key: 'possibleMovesState',
  default: List() as List<List<number>>,
});

export const historyState = atom({
  key: 'historyState',
  default: List() as List<List<List<number>>>,
});

export const numGoatsEatenState = selector({
  key: 'numGoatsEatenState',
  get: ({ get }) => {
    const goats = get(goatsState);
    const numGoatsToPlace = get(numGoatsToPlaceState);

    return NUM_GOATS - numGoatsToPlace - goats.size;
  },
});

export const playersTurnState = selector({
  key: 'playersTurnState',
  get: ({ get }) => {
    const playerNum = get(playerNumState);
    const name = playerNum === 2 ? 'Tiger' : 'Goat';
    const type = playerNum === 2 ? ItemTypes.TIGER : ItemTypes.GOAT;
    return { name, type, isTiger: playerNum === 2, isGoat: playerNum === 1 };
  },
});

export const priorGameState = selector({
  key: 'priorGameState',
  get: ({ get }) => {
    const playerNum = get(playerNumState);
    const numGoatsToPlace = get(numGoatsToPlaceState);
    const history = get(historyState);
    return { playerNum, numGoatsToPlace, history };
  },
});
