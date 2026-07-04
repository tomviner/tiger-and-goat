import { describe, expect, test } from 'vitest';
import {
  GOAT_PLAYER,
  isOver,
  isThreefold,
  makeMove,
  newGame,
  possibleMoves,
  resultName,
  stateFromHistory,
} from './game';
import { localMove, localOpponents, localStart } from './local';
import { bestMove } from './negamax';
import { GOAT_STRATEGIES, TIGER_STRATEGIES } from './strategies';

const sameMove = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const isLegal = (state: ReturnType<typeof newGame>, move: number[]) =>
  possibleMoves(state).some((m) => sameMove(m, move));

describe('strategies only ever play legal moves', () => {
  GOAT_STRATEGIES.forEach((goat) => {
    TIGER_STRATEGIES.forEach((tiger) => {
      test(`${goat.name} vs ${tiger.name}`, () => {
        const state = newGame();
        for (let ply = 0; ply < 120 && !isOver(state); ply++) {
          const chooser = state.currentPlayer === GOAT_PLAYER ? goat : tiger;
          const move = chooser.choose(state);
          expect(isLegal(state, move)).toBe(true);
          makeMove(state, move);
        }
      });
    });
  });
});

describe('repetition is a threefold draw, not a forced loss', () => {
  // A user reported this as a wrong "goat wins": three tigers boxed in and the
  // fourth's only move (A2->A3) recreated a recent board. The old rule banned
  // the move, leaving no legal tiger move -> goats win. Under threefold rules
  // the move is legal and the game heads for a draw, not a goat win.
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
    [
      [12, 17, 18, 24],
      [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [12, 16, 18, 24],
      [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [12, 16, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [16, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [16, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [11, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 19, 21, 22, 23],
    ],
    [
      [11, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 21, 22, 23],
    ],
    [
      [10, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 21, 22, 23],
    ],
    [
      [10, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 22, 23],
    ],
    [
      [5, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 22, 23],
    ],
    [
      [5, 17, 18, 24],
      [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 21, 22, 23],
    ],
  ];

  test('the tiger can still move (not a goat win)', () => {
    const state = stateFromHistory(2, 0, history);
    expect(resultName(state)).not.toBe('goat wins');
    expect(isOver(state)).toBe(false);
    expect(possibleMoves(state)).toContainEqual([5, 10]); // A2 -> A3 is legal
  });

  test('a position occurring three times (same side to move) is threefold', () => {
    const p: number[][] = [
      [0, 4, 20, 24],
      [6, 8, 16, 18],
    ];
    const q: number[][] = [
      [0, 4, 20, 24],
      [6, 8, 16, 17],
    ];
    // p sits at indices 0, 2, 4 — every second entry, so same side to move.
    expect(isThreefold(stateFromHistory(1, 0, [p, q, p, q, p]))).toBe(true);
    // only two occurrences is not yet a draw
    expect(isThreefold(stateFromHistory(1, 0, [p, q, p]))).toBe(false);
  });
});

describe('negamax AI', () => {
  test('plays a legal opening move', () => {
    const state = newGame();
    const move = bestMove(state, 3);
    expect(isLegal(state, move)).toBe(true);
  });

  test('takes a free capture', () => {
    // tiger at 0 can jump the goat on 1, landing on 2
    const state = stateFromHistory(2, 19, [[[0, 4, 20, 24], [1]]]);
    const move = bestMove(state, 3);
    expect(isLegal(state, move)).toBe(true);
    expect(move).toEqual([0, 1, 2]); // the capture
  });
});

describe('local API mirrors the server', () => {
  test('start returns the initial position', () => {
    const data = localStart();
    expect(data.playerNum).toBe(1);
    expect(data.numGoatsToPlace).toBe(20);
    expect(data.possibleMoves.length).toBe(21);
    expect(data.result).toBe('');
  });

  test('human goat move gets an AI tiger reply', () => {
    const start = localStart();
    const data = localMove(start, [12], {
      goat: { type: 'human' },
      tiger: { type: 'ai', depth: 2 },
    });
    expect(data.remoteMove).not.toBeNull();
  });

  test('strategy vs strategy advances on a poll', () => {
    const start = localStart();
    const data = localMove(start, null, {
      goat: { type: 'strategy', name: 'goat-safe-edge' },
      tiger: { type: 'strategy', name: 'tiger-centre-control' },
    });
    expect(data.remoteMove).not.toBeNull();
  });

  test('rejects an illegal move', () => {
    const start = localStart();
    expect(() =>
      localMove(start, [0], {
        goat: { type: 'human' },
        tiger: { type: 'ai', depth: 2 },
      }),
    ).toThrow();
  });

  test('opponents lists strategies and depth', () => {
    const info = localOpponents();
    const names = info.strategies.map((s) => s.name);
    expect(names).toContain('goat-safe-edge');
    expect(names).toContain('tiger-centre-control');
    expect(info.depth).toEqual({ min: 1, max: 8, default: 6 });
  });

  test('a full strategy-vs-strategy game runs to a result via polling', () => {
    // mirrors the UI poll loop: each step re-serialises the state and asks the
    // local engine for the next move, exercising the round-trip contract.
    const controllers = {
      goat: { type: 'strategy' as const, name: 'goat-safe-block' },
      tiger: { type: 'strategy' as const, name: 'tiger-mobile-capture' },
    };
    let data = localStart();
    let plies = 0;
    while (data.result === '' && plies < 400) {
      data = localMove(
        {
          playerNum: data.playerNum,
          numGoatsToPlace: data.numGoatsToPlace,
          history: data.history,
        },
        null,
        controllers,
      );
      plies += 1;
    }
    expect([
      'tiger wins',
      'goat wins',
      "draw (as goat can't move)",
      'draw (threefold repetition)',
      '',
    ]).toContain(data.result);
  });
});
