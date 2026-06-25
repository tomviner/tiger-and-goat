import { describe, expect, test } from 'vitest';
import { moveToNotation, movesFromHistory, posToNotation } from './notation';

describe('notation', () => {
  test('posToNotation maps corners and centre', () => {
    expect(posToNotation(0)).toBe('A1');
    expect(posToNotation(4)).toBe('E1');
    expect(posToNotation(12)).toBe('C3');
    expect(posToNotation(20)).toBe('A5');
    expect(posToNotation(24)).toBe('E5');
  });

  test('moveToNotation renders place / step / jump', () => {
    expect(moveToNotation([12])).toBe('C3'); // placement
    expect(moveToNotation([16, 21])).toBe('B4-B5'); // step
    expect(moveToNotation([20, 16, 12])).toBe('A5-B4-C3'); // capture
  });

  test('movesFromHistory recovers each move (incl. a tiger capture)', () => {
    // the history a user reported a "last move" question about
    const history = [
      [
        [12, 17, 20, 24],
        [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
      ],
      [
        [12, 17, 20, 24],
        [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 19, 21, 22, 23],
      ],
      [
        [12, 18, 20, 24],
        [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 19, 21, 22, 23],
      ],
      [
        [12, 18, 20, 24],
        [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 19, 21, 22, 23],
      ],
      [
        [17, 18, 20, 24],
        [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 19, 21, 22, 23],
      ],
      [
        [17, 18, 20, 24],
        [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 19, 21, 22, 23],
      ],
      [
        [12, 17, 18, 24],
        [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
      ],
    ];
    const moves = movesFromHistory(history);
    expect(moves.map(moveToNotation)).toEqual([
      'B4', // goat placement
      'C4-D4', // tiger step
      'B2-B1', // goat step
      'C3-C4', // tiger step
      'A2-B2', // goat step
      'A5-B4-C3', // tiger jump, capturing the goat on B4
    ]);
  });
});
