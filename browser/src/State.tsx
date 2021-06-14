import { List } from 'immutable';
import { atom, DefaultValue, selector } from 'recoil';
import { ItemTypes, NUM_GOATS } from './Constants';

export const playerNumState = atom({
  key: 'playerNumState',
  default: 1,
});

export const numGoatsToPlaceState = atom({
  key: 'numGoatsToPlaceState',
  default: NUM_GOATS,
});

export const possibleMovesState = atom({
  key: 'possibleMovesState',
  default: List() as List<List<number>>,
});

export const resultState = atom({
  key: 'resultState',
  default: '',
});

export const historyState = atom({
  key: 'historyState',
  default: List() as List<List<List<number>>>,
});

export const tigersState = selector({
  key: 'tigersState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List()) as List<List<number>>;
    return lastPieces.get(0, List());
  },
});

export const goatsState = selector({
  key: 'goatsState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List()) as List<List<number>>;
    return lastPieces.get(1, List()) as List<number>;
  },
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

export type StateOfGameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: List<List<List<number>>>;
};

export const stateOfGameState = selector<StateOfGameType>({
  key: 'stateOfGameState',
  get: ({ get }) => {
    const playerNum = get(playerNumState);
    const numGoatsToPlace = get(numGoatsToPlaceState);
    const history = get(historyState);
    return { playerNum, numGoatsToPlace, history };
  },
  set: ({ set }, updatedGame) => {
    if (!(updatedGame instanceof DefaultValue)) {
      const { playerNum, numGoatsToPlace, history } = updatedGame;
      set(playerNumState, playerNum);
      set(numGoatsToPlaceState, numGoatsToPlace);
      set(historyState, history);
    }
  },
});

export interface UpdatedGameType extends StateOfGameType {
  possibleMoves: List<List<number>>;
  result: string;
}

export const updatedGameState = selector<UpdatedGameType>({
  key: 'updatedGameState',
  get: ({ get }) => {
    const stateOfGame = get(stateOfGameState);
    const possibleMoves = get(possibleMovesState);
    const result = get(resultState);
    return { ...stateOfGame, possibleMoves, result };
  },
  set: ({ set }, updatedGame) => {
    if (!(updatedGame instanceof DefaultValue)) {
      const { possibleMoves, result } = updatedGame;
      set(stateOfGameState, updatedGame);
      set(possibleMovesState, possibleMoves);
      set(resultState, result);
    }
  },
});
