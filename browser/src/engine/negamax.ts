// A compact negamax search with alpha-beta pruning and iterative deepening.
// Uses the same scoring as server/game.py. Iterative deepening with a time
// budget keeps the browser responsive: we return the best move from the
// deepest fully-searched depth rather than blocking on a fixed depth.
import {
  EngineState,
  isOver,
  makeMove,
  Move,
  possibleMoves,
  scoring,
  unmakeMove,
} from './game';

// Captures (length 3) first — searching forcing moves early prunes more.
const orderedMoves = (state: EngineState): Move[] =>
  possibleMoves(state).sort((a, b) => b.length - a.length);

function negamax(
  state: EngineState,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0 || isOver(state)) {
    return scoring(state);
  }
  let best = -Infinity;
  for (const move of orderedMoves(state)) {
    const captured = makeMove(state, move);
    const value = -negamax(state, depth - 1, -beta, -alpha);
    unmakeMove(state, move, captured);
    if (value > best) {
      best = value;
    }
    if (best > alpha) {
      alpha = best;
    }
    if (alpha >= beta) {
      break;
    }
  }
  return best;
}

export function bestMove(state: EngineState, maxDepth: number, budgetMs = 1200): Move {
  const rootMoves = orderedMoves(state);
  let chosen = rootMoves[0];
  const deadline = performance.now() + budgetMs;

  for (let depth = 1; depth <= maxDepth; depth++) {
    let bestValue = -Infinity;
    let bestAtDepth = chosen;
    let alpha = -Infinity;
    let completed = true;

    for (const move of rootMoves) {
      const captured = makeMove(state, move);
      const value = -negamax(state, depth - 1, -Infinity, -alpha);
      unmakeMove(state, move, captured);
      if (value > bestValue) {
        bestValue = value;
        bestAtDepth = move;
      }
      if (value > alpha) {
        alpha = value;
      }
      if (performance.now() > deadline) {
        completed = false;
        break;
      }
    }

    if (completed) {
      chosen = bestAtDepth;
    } else {
      break;
    }
  }
  return chosen;
}
