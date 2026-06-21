// Browser port of server/strategies.py. Each strategy is a human-replicable
// rule reasoning at most one move ahead; ties are broken at random.
import { divmod } from '../utils';
import {
  applyToSets,
  EngineState,
  GOAT_PLAYER,
  JUMP_NEIGHBOURS,
  Move,
  possibleMoves,
  STEP_NEIGHBOURS,
  TIGER_PLAYER,
} from './game';

export const STRONG_POINTS = new Set(
  [...Array(25).keys()].filter((n) => STEP_NEIGHBOURS[n].length === 8),
);

function isEdge(pos: number): boolean {
  const [y, x] = divmod(pos, 5);
  return x === 0 || x === 4 || y === 0 || y === 4;
}

export const EDGE_POINTS = new Set([...Array(25).keys()].filter(isEdge));

function manhattanToCentre(pos: number): number {
  const [y, x] = divmod(pos, 5);
  return Math.abs(x - 2) + Math.abs(y - 2);
}

type Sets = [Set<number>, Set<number>]; // [tigers, goats]

function applied(move: Move, tigers: Set<number>, goats: Set<number>): Sets {
  const t = new Set(tigers);
  const g = new Set(goats);
  applyToSets(move, t, g);
  return [t, g];
}

function capturesOf(tigers: Set<number>, goats: Set<number>): Move[] {
  const occ = new Set([...tigers, ...goats]);
  const moves: Move[] = [];
  for (const t of tigers) {
    for (const dest of JUMP_NEIGHBOURS[t]) {
      const eaten = (t + dest) / 2;
      if (goats.has(eaten) && !occ.has(dest)) {
        moves.push([t, eaten, dest]);
      }
    }
  }
  return moves;
}

function mobilityOf(tigers: Set<number>, goats: Set<number>): number {
  const occ = new Set([...tigers, ...goats]);
  let steps = 0;
  for (const t of tigers) {
    for (const dest of STEP_NEIGHBOURS[t]) {
      if (!occ.has(dest)) {
        steps += 1;
      }
    }
  }
  return capturesOf(tigers, goats).length + steps;
}

const numCapturable = (tigers: Set<number>, goats: Set<number>): number =>
  capturesOf(tigers, goats).length;

const goatDest = (move: Move): number => (move.length === 1 ? move[0] : move[1]);

// Compare composite keys (booleans count as 1/0), highest wins.
function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

const randChoice = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

function argbest(items: Move[], keyFn: (m: Move) => number[]): Move {
  let best: number[] | null = null;
  let bucket: Move[] = [];
  for (const item of items) {
    const k = keyFn(item);
    if (best === null || cmp(k, best) > 0) {
      best = k;
      bucket = [item];
    } else if (cmp(k, best) === 0) {
      bucket.push(item);
    }
  }
  return randChoice(bucket);
}

export interface Strategy {
  name: string;
  side: number;
  description: string;
  choose(state: EngineState): Move;
}

// --- goat strategies ---------------------------------------------------------

function safeGoatMoves(state: EngineState, moves: Move[]): Move[] {
  const { tigers, goats } = state;
  const before = numCapturable(tigers, goats);
  const safe = moves.filter((m) => {
    const [t, g] = applied(m, tigers, goats);
    return numCapturable(t, g) <= before;
  });
  return safe.length ? safe : moves;
}

function goatAdjacency(move: Move, goats: Set<number>): number {
  const dest = goatDest(move);
  const src = move.length === 2 ? move[0] : null;
  return STEP_NEIGHBOURS[dest].filter((nb) => goats.has(nb) && nb !== src).length;
}

const goatStrategy = (
  name: string,
  description: string,
  prefer: (state: EngineState, moves: Move[]) => Move,
): Strategy => ({
  name,
  side: GOAT_PLAYER,
  description,
  choose(state) {
    return prefer(state, safeGoatMoves(state, possibleMoves(state)));
  },
});

export const GOAT_STRATEGIES: Strategy[] = [
  {
    name: 'goat-random',
    side: GOAT_PLAYER,
    description: 'Play a random legal move (placement or step). Baseline.',
    choose: (state) => randChoice(possibleMoves(state)),
  },
  goatStrategy(
    'goat-safe',
    'Never put a goat where a tiger could jump it next turn; otherwise pick ' +
      'freely among the safe moves.',
    (_state, moves) => randChoice(moves),
  ),
  goatStrategy(
    'goat-safe-block',
    'Among safe moves, choose the one that leaves the tigers with the fewest ' +
      'moves — hem the tigers in while never offering a capture.',
    (state, moves) =>
      argbest(moves, (m) => [-mobilityOf(...applied(m, state.tigers, state.goats))]),
  ),
  goatStrategy(
    'goat-safe-connected',
    'Among safe moves, keep goats touching each other — pick the move whose ' +
      'goat ends up next to the most friendly goats, building a solid wall.',
    (state, moves) => argbest(moves, (m) => [goatAdjacency(m, state.goats)]),
  ),
  goatStrategy(
    'goat-safe-strong-points',
    'Among safe moves, grab the strong central points first (the most ' +
      'connected squares); break ties by hemming the tigers in.',
    (state, moves) =>
      argbest(moves, (m) => [
        STRONG_POINTS.has(goatDest(m)) ? 1 : 0,
        -mobilityOf(...applied(m, state.tigers, state.goats)),
      ]),
  ),
  goatStrategy(
    'goat-safe-edge',
    'Among safe moves, build from the rim — prefer perimeter squares, which ' +
      'give tigers fewer places to land; break ties by staying connected.',
    (state, moves) =>
      argbest(moves, (m) => [
        EDGE_POINTS.has(goatDest(m)) ? 1 : 0,
        goatAdjacency(m, state.goats),
      ]),
  ),
];

// --- tiger strategies --------------------------------------------------------

const split = (moves: Move[]): [Move[], Move[]] => [
  moves.filter((m) => m.length === 3),
  moves.filter((m) => m.length === 2),
];

const bestCapture = (state: EngineState, captures: Move[]): Move =>
  argbest(captures, (m) => [mobilityOf(...applied(m, state.tigers, state.goats))]);

const tigerStrategy = (
  name: string,
  description: string,
  pick: (state: EngineState, captures: Move[], steps: Move[]) => Move,
): Strategy => ({
  name,
  side: TIGER_PLAYER,
  description,
  choose(state) {
    const [captures, steps] = split(possibleMoves(state));
    return pick(state, captures, steps);
  },
});

export const TIGER_STRATEGIES: Strategy[] = [
  tigerStrategy(
    'tiger-random',
    'Play a random legal move, capture or not. Baseline.',
    (_state, captures, steps) => randChoice([...captures, ...steps]),
  ),
  tigerStrategy(
    'tiger-greedy-capture',
    'Always take a capture when one exists (any of them); otherwise step at ' +
      "random. The simple 'eat whenever you can' instinct.",
    (_state, captures, steps) =>
      captures.length ? randChoice(captures) : randChoice(steps),
  ),
  tigerStrategy(
    'tiger-mobile-capture',
    'Always capture when possible, but pick the capture (and otherwise the ' +
      'step) that keeps the tigers with the most moves — eat without trapping ' +
      'yourself.',
    (state, captures, steps) =>
      captures.length
        ? bestCapture(state, captures)
        : argbest(steps, (m) => [mobilityOf(...applied(m, state.tigers, state.goats))]),
  ),
  tigerStrategy(
    'tiger-threat-builder',
    'Capture when possible; otherwise move to threaten the most goats next ' +
      "turn, setting up jumps (including forks the goat can't fully answer).",
    (state, captures, steps) =>
      captures.length
        ? bestCapture(state, captures)
        : argbest(steps, (m) => {
            const [t, g] = applied(m, state.tigers, state.goats);
            return [numCapturable(t, g), mobilityOf(t, g)];
          }),
  ),
  tigerStrategy(
    'tiger-centre-control',
    'Capture when possible; otherwise march tigers toward the strong central ' +
      "points, controlling the board's busiest lines.",
    (state, captures, steps) =>
      captures.length
        ? bestCapture(state, captures)
        : argbest(steps, (m) => [
            STRONG_POINTS.has(m[1]) ? 1 : 0,
            -manhattanToCentre(m[1]),
          ]),
  ),
];

export const STRATEGY_BY_NAME: Record<string, Strategy> = Object.fromEntries(
  [...GOAT_STRATEGIES, ...TIGER_STRATEGIES].map((s) => [s.name, s]),
);
