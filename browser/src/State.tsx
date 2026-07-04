import { List, Set } from 'immutable';
import { atom, DefaultValue, selector } from 'recoil';
import { Controllers } from './api';
import { ItemTypes, NUM_GOATS } from './Constants';

export const playerNumState = atom({
  key: 'playerNumState',
  default: 1,
});

// Where moves are computed: the Python server, or the engine ported into the
// browser. A static build can default to 'local' via VITE_ENGINE=local.
export type EngineMode = 'server' | 'local';

const DEFAULT_ENGINE: EngineMode =
  import.meta.env.VITE_ENGINE === 'local' ? 'local' : 'server';

export const engineModeState = atom<EngineMode>({
  key: 'engineModeState',
  default: DEFAULT_ENGINE,
});

// Who controls each side. Defaults to the classic setup: you play the goats,
// the search AI plays the tigers. Either side can be set to Human, AI, or a
// named strategy via the dropdowns.
export const controllersState = atom<Controllers>({
  key: 'controllersState',
  default: { goat: { type: 'human' }, tiger: { type: 'ai', depth: 6 } },
});

export const numGoatsToPlaceState = atom({
  key: 'numGoatsToPlaceState',
  default: NUM_GOATS,
});

export const possibleMovesState = atom<Set<List<number>>>({
  key: 'possibleMovesState',
  default: Set() as Set<List<number>>,
});

export const resultState = atom({
  key: 'resultState',
  default: '',
});

// Every move played this game, in order (goat moves first, then alternating),
// for the debug move list. Each move is [place], [from, to] or [from, eaten, to].
export const moveLogState = atom<number[][]>({
  key: 'moveLogState',
  default: [],
});

// The board square a goat was last captured from, used to animate it flying to
// the eaten pile. Set for any capture — by the AI/strategy (a remote move) or
// by a human (in hotseat) — so the animation works regardless of who jumped.
export const lastEatenSquareState = atom<number | null>({
  key: 'lastEatenSquareState',
  default: null,
});

export const historyState = atom<List<List<Set<number>>>>({
  key: 'historyState',
  default: List() as List<List<Set<number>>>,
});

export const remoteMoveState = atom<List<number> | null>({
  key: 'remoteMoveState',
  default: null as List<number> | null,
});

export const tigersState = selector<Set<number>>({
  key: 'tigersState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List<Set<number>>());
    return lastPieces.get(0, Set<number>());
  },
});

export const goatsState = selector<Set<number>>({
  key: 'goatsState',
  get: ({ get }) => {
    const history = get(historyState);
    const lastPieces = history.last(List<Set<number>>());
    return lastPieces.get(1, Set<number>());
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
      // A remote capture (jump) is a 3-element move [src, eaten, dest]; record
      // the eaten square so the goat animates to the eaten pile. Only set on a
      // capture so a human capture's value (set in doMove) isn't cleared.
      if (remoteMove && remoteMove.size === 3) {
        set(lastEatenSquareState, remoteMove.get(1) as number);
      }
    }
  },
});
