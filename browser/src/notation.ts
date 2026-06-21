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
