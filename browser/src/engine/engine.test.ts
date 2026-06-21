import { describe, expect, test } from 'vitest';
import fixtures from './__fixtures__/parity.json';
import { canonical, makeMove, newGame, possibleMoves, resultName } from './game';

const sortMoves = (moves: number[][]): number[][] =>
  [...moves].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

describe('engine matches the Python engine on recorded games', () => {
  fixtures.forEach((fx) => {
    test(`${fx.goat} vs ${fx.tiger} (seed ${fx.seed})`, () => {
      const state = newGame();
      fx.plies.forEach((ply) => {
        // same side to move, same placement count, same board
        expect(state.currentPlayer).toBe(ply.playerNum);
        expect(state.goatsToPlace).toBe(ply.goatsToPlace);
        expect(canonical(state)).toEqual(ply.position);
        // identical set of legal moves
        expect(sortMoves(possibleMoves(state))).toEqual(sortMoves(ply.possibleMoves));
        makeMove(state, ply.move);
      });
      expect(resultName(state)).toBe(fx.finalResult);
      expect(canonical(state)).toEqual(fx.finalPosition);
      expect(state.goatsToPlace).toBe(fx.finalGoatsToPlace);
      expect(state.currentPlayer).toBe(fx.finalPlayerNum);
    });
  });
});
