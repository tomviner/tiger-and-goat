// A1..E5 coordinate notation (columns A-E left-to-right, rows 1-5 top-to-bottom),
// matching server/notations.py.
export function posToNotation(posNum: number): string {
  const x = posNum % 5;
  const y = Math.floor(posNum / 5);
  return `${'ABCDE'[x]}${y + 1}`;
}

// A move is [place], [from, to], or [from, eaten, to]; join with '-' (a capture
// reads from-eaten-to, e.g. B4-C4-D4).
export function moveToNotation(move: number[]): string {
  return move.map(posToNotation).join('-');
}

type Position = [number[], number[]]; // [tigers, goats]

// Recover the move that turned `before` into `after` by diffing the pieces.
export function moveBetween(before: Position, after: Position): number[] | null {
  const [tigersBefore, goatsBefore] = before;
  const [tigersAfter, goatsAfter] = after;
  const tA = new Set(tigersAfter);
  const tB = new Set(tigersBefore);
  const gA = new Set(goatsAfter);
  const gB = new Set(goatsBefore);

  const tigerFrom = tigersBefore.find((t) => !tA.has(t));
  const tigerTo = tigersAfter.find((t) => !tB.has(t));
  const goatGone = goatsBefore.find((g) => !gA.has(g));
  const goatNew = goatsAfter.find((g) => !gB.has(g));

  if (tigerFrom !== undefined && tigerTo !== undefined) {
    return goatGone !== undefined
      ? [tigerFrom, goatGone, tigerTo] // jump (capture)
      : [tigerFrom, tigerTo]; // step
  }
  if (goatNew !== undefined && goatGone === undefined) {
    return [goatNew]; // placement
  }
  if (goatNew !== undefined && goatGone !== undefined) {
    return [goatGone, goatNew]; // goat step
  }
  return null;
}

// Derive the move list from a sequence of board positions.
export function movesFromHistory(history: number[][][]): number[][] {
  const moves: number[][] = [];
  for (let i = 1; i < history.length; i++) {
    const move = moveBetween(history[i - 1] as Position, history[i] as Position);
    if (move) {
      moves.push(move);
    }
  }
  return moves;
}
