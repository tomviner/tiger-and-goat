// A plain-TypeScript port of server/game.py so the whole game can run in the
// browser with no server. The move rules here mirror the Python engine exactly
// (verified by the parity fixtures in engine.test.ts).
import { JUMPS_GRAPH, STEPS_GRAPH } from '../graph';

export const GOAT_PLAYER = 1;
export const TIGER_PLAYER = 2;
export const NUM_GOATS = 20;
export const NUM_EATEN_LOSE = 5;
export const STARTING_TIGERS = [0, 4, 20, 24];

// Plain adjacency tables derived from the shared Immutable graphs.
const STEPS: number[][] = [];
const JUMPS: number[][] = [];
for (let n = 0; n < 25; n++) {
  STEPS[n] = (STEPS_GRAPH.get(n)?.toArray() ?? []) as number[];
  JUMPS[n] = (JUMPS_GRAPH.get(n)?.toArray() ?? []) as number[];
}

export const STEP_NEIGHBOURS = STEPS;
export const JUMP_NEIGHBOURS = JUMPS;

export type Move = number[]; // length 1 (place), 2 (step), or 3 (jump)
export type Position = [number[], number[]]; // [sortedTigers, sortedGoats]

export interface EngineState {
  tigers: Set<number>;
  goats: Set<number>;
  goatsToPlace: number;
  currentPlayer: number;
  history: Position[]; // canonical positions, most recent last
}

const sorted = (s: Set<number>): number[] => [...s].sort((a, b) => a - b);
const key = (p: Position): string => `${p[0].join(',')}|${p[1].join(',')}`;

export const canonical = (state: EngineState): Position => [
  sorted(state.tigers),
  sorted(state.goats),
];

export function newGame(): EngineState {
  const state: EngineState = {
    tigers: new Set(STARTING_TIGERS),
    goats: new Set(),
    goatsToPlace: NUM_GOATS,
    currentPlayer: GOAT_PLAYER,
    history: [],
  };
  state.history.push(canonical(state));
  return state;
}

export function stateFromHistory(
  playerNum: number,
  goatsToPlace: number,
  history: number[][][],
): EngineState {
  const last = history[history.length - 1];
  return {
    tigers: new Set(last[0]),
    goats: new Set(last[1]),
    goatsToPlace,
    currentPlayer: playerNum,
    history: history.map((p) => [
      [...p[0]].sort((a, b) => a - b),
      [...p[1]].sort((a, b) => a - b),
    ]),
  };
}

const occupied = (state: EngineState): Set<number> =>
  new Set([...state.tigers, ...state.goats]);

function repetitionCount(state: EngineState): number {
  if (state.goatsToPlace > 0) {
    return 1;
  }
  // The latest history entry is the current position with the current side to
  // move; positions alternate side to move, so step back two at a time.
  const current = key(canonical(state));
  let count = 0;
  for (let i = state.history.length - 1; i >= 0; i -= 2) {
    if (key(state.history[i]) === current) {
      count += 1;
    }
  }
  return count;
}

export function isThreefold(state: EngineState): boolean {
  return state.goatsToPlace === 0 && repetitionCount(state) >= 3;
}

export function applyToSets(move: Move, tigers: Set<number>, goats: Set<number>): void {
  if (move.length === 1) {
    goats.add(move[0]);
  } else if (move.length === 2) {
    const [src, dest] = move;
    if (tigers.has(src)) {
      tigers.delete(src);
      tigers.add(dest);
    } else {
      goats.delete(src);
      goats.add(dest);
    }
  } else {
    const [src, eaten, dest] = move;
    tigers.delete(src);
    tigers.add(dest);
    goats.delete(eaten);
  }
}

export function tigerCaptures(state: EngineState): Move[] {
  const occ = occupied(state);
  const moves: Move[] = [];
  for (const t of state.tigers) {
    for (const dest of JUMPS[t]) {
      const eaten = (t + dest) / 2;
      if (state.goats.has(eaten) && !occ.has(dest)) {
        moves.push([t, eaten, dest]);
      }
    }
  }
  return moves;
}

function tigerSteps(state: EngineState): Move[] {
  const occ = occupied(state);
  const moves: Move[] = [];
  for (const t of state.tigers) {
    for (const dest of STEPS[t]) {
      if (!occ.has(dest)) {
        moves.push([t, dest]);
      }
    }
  }
  return moves;
}

function goatPlacements(state: EngineState): Move[] {
  const occ = occupied(state);
  const moves: Move[] = [];
  for (let pos = 0; pos < 25; pos++) {
    if (!occ.has(pos)) {
      moves.push([pos]);
    }
  }
  return moves;
}

function goatSteps(state: EngineState): Move[] {
  const occ = occupied(state);
  const moves: Move[] = [];
  for (const g of state.goats) {
    for (const dest of STEPS[g]) {
      if (!occ.has(dest)) {
        moves.push([g, dest]);
      }
    }
  }
  return moves;
}

export function possibleMoves(state: EngineState): Move[] {
  if (state.currentPlayer === TIGER_PLAYER) {
    return [...tigerCaptures(state), ...tigerSteps(state)];
  }
  return state.goatsToPlace > 0 ? goatPlacements(state) : goatSteps(state);
}

export function mobileTigers(state: EngineState): number {
  const occ = occupied(state);
  const sources = new Set<number>();
  for (const t of state.tigers) {
    let mobile = JUMPS[t].some(
      (dest) => state.goats.has((t + dest) / 2) && !occ.has(dest),
    );
    if (!mobile) {
      mobile = STEPS[t].some((dest) => !occ.has(dest));
    }
    if (mobile) {
      sources.add(t);
    }
  }
  return sources.size;
}

export const goatsEaten = (state: EngineState): number =>
  NUM_GOATS - state.goatsToPlace - state.goats.size;

const tigersGo = (state: EngineState): boolean => state.currentPlayer === TIGER_PLAYER;
const goatsGo = (state: EngineState): boolean => state.currentPlayer === GOAT_PLAYER;

export const tigerWins = (state: EngineState): boolean =>
  goatsEaten(state) >= NUM_EATEN_LOSE;

export const goatWins = (state: EngineState): boolean =>
  tigersGo(state) && mobileTigers(state) === 0;

export function isDraw(state: EngineState): boolean {
  if (state.goatsToPlace > 0) {
    return false;
  }
  if (isThreefold(state)) {
    return true;
  }
  if (tigersGo(state)) {
    return false;
  }
  return possibleMoves(state).length === 0;
}

export const isOver = (state: EngineState): boolean =>
  tigerWins(state) || goatWins(state) || isDraw(state);

export function resultName(state: EngineState): string {
  if (tigerWins(state)) {
    return 'tiger wins';
  }
  if (goatWins(state)) {
    return 'goat wins';
  }
  if (isThreefold(state)) {
    return 'draw (threefold repetition)';
  }
  if (isDraw(state)) {
    return "draw (as goat can't move)";
  }
  return '';
}

export function scoring(state: EngineState): number {
  // Written from the tiger's point of view, then flipped for the goat.
  let mobile = mobileTigers(state);
  if (mobile === 0 && goatsGo(state)) {
    mobile = 1;
  }
  let score: number;
  if (tigerWins(state)) {
    score = 100;
  } else if (goatWins(state)) {
    score = -100;
  } else if (isDraw(state)) {
    score = 0;
  } else {
    score = 10 * goatsEaten(state) + mobile;
  }
  return goatsGo(state) ? -score : score;
}

// makeMove returns the eaten goat (or null) so unmakeMove can restore it.
export function makeMove(state: EngineState, move: Move): number | null {
  let captured: number | null = null;
  applyToSets(move, state.tigers, state.goats);
  if (move.length === 1) {
    state.goatsToPlace -= 1;
  } else if (move.length === 3) {
    captured = move[1];
  }
  state.history.push(canonical(state));
  state.currentPlayer =
    state.currentPlayer === GOAT_PLAYER ? TIGER_PLAYER : GOAT_PLAYER;
  return captured;
}

export function unmakeMove(
  state: EngineState,
  move: Move,
  captured: number | null,
): void {
  state.currentPlayer =
    state.currentPlayer === GOAT_PLAYER ? TIGER_PLAYER : GOAT_PLAYER;
  state.history.pop();
  if (move.length === 1) {
    state.goats.delete(move[0]);
    state.goatsToPlace += 1;
  } else if (move.length === 2) {
    const [src, dest] = move;
    if (state.tigers.has(dest)) {
      state.tigers.delete(dest);
      state.tigers.add(src);
    } else {
      state.goats.delete(dest);
      state.goats.add(src);
    }
  } else {
    const [src, , dest] = move;
    state.tigers.delete(dest);
    state.tigers.add(src);
    if (captured !== null) {
      state.goats.add(captured);
    }
  }
}
