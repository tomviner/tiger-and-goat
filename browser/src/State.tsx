import { List, Set } from 'immutable';
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
  default: Set() as Set<List<number>>,
});

export const resultState = atom({
  key: 'resultState',
  default: '',
});

export const historyState = atom({
  key: 'historyState',
  default: List() as List<List<Set<number>>>,
});

export const remoteMoveState = atom<List<number> | null>({
  key: 'remoteMoveState',
  default: null as List<number> | null,
});

export const tigersState = selector({
  key: 'tigersState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List()) as List<Set<number>>;
    return lastPieces.get(0, Set());
  },
});

export const goatsState = selector({
  key: 'goatsState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List()) as List<Set<number>>;
    return lastPieces.get(1, Set());
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
    const isTiger = playerNum === 2;
    const name = isTiger ? 'Tiger' : 'Goat';
    const type = isTiger ? ItemTypes.TIGER : ItemTypes.GOAT;
    const otherPlayerNum = isTiger ? 1 : 2;
    return { name, type, playerNum, otherPlayerNum };
  },
});

export type StateOfGameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: List<List<Set<number>>>;
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
  possibleMoves: Set<List<number>>;
  result: string;
  remoteMove: List<number> | null;
}

export const updatedGameState = selector<UpdatedGameType>({
  key: 'updatedGameState',
  get: ({ get }) => {
    const stateOfGame = get(stateOfGameState);
    const possibleMoves = get(possibleMovesState);
    const result = get(resultState);
    const remoteMove = get(remoteMoveState);
    return { ...stateOfGame, possibleMoves, result, remoteMove };
  },
  set: ({ set }, updatedGame) => {
    if (!(updatedGame instanceof DefaultValue)) {
      const { possibleMoves, result, remoteMove } = updatedGame;
      set(stateOfGameState, updatedGame);
      set(possibleMovesState, possibleMoves);
      set(resultState, result);
      set(remoteMoveState, remoteMove);
    }
  },
});
