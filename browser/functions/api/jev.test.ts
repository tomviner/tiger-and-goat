import { describe, expect, test } from 'vitest';
import { buildJevInput, moveFromJevResponse, onRequestPost } from './jev';

const requestBody = {
  state: {
    playerNum: 2,
    numGoatsToPlace: 19,
    history: [[[0, 4, 20, 24], [12]]],
  },
  possibleMoves: [
    [0, 1],
    [0, 6],
    [4, 3],
  ],
};

describe('Jev move contract', () => {
  test('presents every legal move as a typed choice', () => {
    expect(buildJevInput(requestBody)).toEqual({
      state: {
        game: 'Bagh-Chal (Tigers and Goats)',
        objective:
          'Tigers win by capturing five goats. Goats win by trapping all four tigers.',
        side_to_move: 'tiger',
        goats_left_to_place: 19,
        board: { tigers: ['A1', 'E1', 'A5', 'E5'], goats: ['C3'] },
      },
      questions: {
        move: {
          type: 'choice',
          instructions:
            'Choose the strongest legal move for the tiger side. Prefer captures and immediate wins, avoid immediate losses, and improve the side-to-move position.',
          criteria: {
            move_0: 'A1 to B1',
            move_1: 'A1 to B2',
            move_2: 'E1 to D1',
          },
        },
      },
    });
  });

  test('maps Jev choice keys back to the exact legal move', () => {
    expect(
      moveFromJevResponse(
        {
          model: 'jev-1.13.0',
          answers: { move: { type: 'choice', choice: 'move_1', confidence: 0.82 } },
        },
        requestBody.possibleMoves,
      ),
    ).toEqual({ move: [0, 6], confidence: 0.82, model: 'jev-1.13.0' });
  });

  test('rejects a choice that is not one of the supplied legal moves', () => {
    expect(() =>
      moveFromJevResponse(
        { answers: { move: { type: 'choice', choice: 'move_99' } } },
        requestBody.possibleMoves,
      ),
    ).toThrow('Jev returned an invalid move choice');
  });

  test('runs the Cloudflare model and returns its legal move', async () => {
    const calls: unknown[][] = [];
    const response = await onRequestPost({
      request: new Request('https://tigergoat.tomv.uk/api/jev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env: {
        AI: {
          run: async (...args: unknown[]) => {
            calls.push(args);
            return {
              model: 'jev-1.13.0',
              answers: {
                move: { type: 'choice', choice: 'move_2', confidence: 0.75 },
              },
            };
          },
        },
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      move: [4, 3],
      confidence: 0.75,
      model: 'jev-1.13.0',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('typesafe/jev');
  });

  test('rejects malformed game payloads before spending an inference', async () => {
    let called = false;
    const response = await onRequestPost({
      request: new Request('https://tigergoat.tomv.uk/api/jev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...requestBody, possibleMoves: [[25]] }),
      }),
      env: {
        AI: {
          run: async () => {
            called = true;
            return {};
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid game state' });
    expect(called).toBe(false);
  });

  test('rejects browser requests originating from another site', async () => {
    let called = false;
    const response = await onRequestPost({
      request: new Request('https://tigergoat.tomv.uk/api/jev', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://attacker.example',
        },
        body: JSON.stringify(requestBody),
      }),
      env: {
        AI: {
          run: async () => {
            called = true;
            return {};
          },
        },
      },
    });

    expect(response.status).toBe(403);
    expect(called).toBe(false);
  });
});
