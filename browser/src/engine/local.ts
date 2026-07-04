// The local engine API: mirrors the server's /start, /move and /opponents so
// the app can run with no backend (a purely static deployment).
import { Controller, Controllers, OpponentsInfo } from '../api';
import {
  canonical,
  EngineState,
  GOAT_PLAYER,
  isOver,
  makeMove,
  Move,
  newGame,
  possibleMoves,
  resultName,
  stateFromHistory,
} from './game';
import { bestMove } from './negamax';
import { GOAT_STRATEGIES, STRATEGY_BY_NAME, TIGER_STRATEGIES } from './strategies';

const MAX_HISTORY = 20;
const DEFAULT_DEPTH = 6;

export interface RawUpdatedGame {
  playerNum: number;
  numGoatsToPlace: number;
  history: number[][][];
  possibleMoves: number[][];
  result: string;
  remoteMove: number[] | null;
}

const sameMove = (a: Move, b: Move): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

function asRaw(state: EngineState, remoteMove: number[] | null): RawUpdatedGame {
  // Match server as_dict: while placing goats only the latest position is sent
  // (no repetition loops yet); in the movement phase send the recent history so
  // repetition can be detected, capped like the server's bounded deque.
  const positions =
    state.goatsToPlace > 0 ? [canonical(state)] : state.history.slice(-MAX_HISTORY);
  return {
    playerNum: state.currentPlayer,
    numGoatsToPlace: state.goatsToPlace,
    history: positions.map((p) => [p[0], p[1]]),
    possibleMoves: possibleMoves(state),
    result: resultName(state),
    remoteMove,
  };
}

function engineMove(state: EngineState, controller: Controller): Move {
  if (controller.type === 'strategy') {
    const strategy = STRATEGY_BY_NAME[controller.name];
    if (strategy && strategy.side === state.currentPlayer) {
      return strategy.choose(state);
    }
  }
  const depth = controller.type === 'ai' ? controller.depth : DEFAULT_DEPTH;
  return bestMove(state, depth);
}

export function localStart(): RawUpdatedGame {
  return asRaw(newGame(), null);
}

// Recompute a position's possible moves / result without playing a move — used
// to load and inspect an arbitrary board (the debug panel).
export function localDescribe(stateOfGame: {
  playerNum: number;
  numGoatsToPlace: number;
  history: number[][][];
}): RawUpdatedGame {
  const state = stateFromHistory(
    stateOfGame.playerNum,
    stateOfGame.numGoatsToPlace,
    stateOfGame.history,
  );
  return asRaw(state, null);
}

export function localMove(
  stateOfGame: { playerNum: number; numGoatsToPlace: number; history: number[][][] },
  move: number[] | null,
  controllers: Controllers,
): RawUpdatedGame {
  const state = stateFromHistory(
    stateOfGame.playerNum,
    stateOfGame.numGoatsToPlace,
    stateOfGame.history,
  );

  if (move !== null) {
    if (!possibleMoves(state).some((m) => sameMove(m, move))) {
      throw Error('Illegal move');
    }
    makeMove(state, move);
  }

  let remoteMove: number[] | null = null;
  if (!isOver(state)) {
    const controller =
      state.currentPlayer === GOAT_PLAYER ? controllers.goat : controllers.tiger;
    if (controller.type !== 'human') {
      remoteMove = engineMove(state, controller);
      makeMove(state, remoteMove);
    }
  }

  return asRaw(state, remoteMove);
}

export function localOpponents(): OpponentsInfo {
  return {
    strategies: [...GOAT_STRATEGIES, ...TIGER_STRATEGIES].map((s) => ({
      name: s.name,
      side: s.side,
      sideName: s.side === GOAT_PLAYER ? 'goat' : 'tiger',
      description: s.description,
    })),
    depth: { min: 1, max: 8, default: DEFAULT_DEPTH },
  };
}
