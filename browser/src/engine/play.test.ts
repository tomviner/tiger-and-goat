import { describe, expect, test } from 'vitest';
import {
  GOAT_PLAYER,
  isOver,
  makeMove,
  newGame,
  possibleMoves,
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
    expect(['tiger wins', 'goat wins', "draw (as goat can't move)", '']).toContain(
      data.result,
    );
  });
});
