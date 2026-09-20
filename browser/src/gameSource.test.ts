import { List } from 'immutable';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseUpdatedGame } from './api';
import { localStart } from './engine/local';
import { sendMove } from './gameSource';

afterEach(() => vi.unstubAllGlobals());

describe('Cloudflare Jev controller', () => {
  test('applies the move returned by Jev as the remote move', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ move: [12], confidence: 0.9, model: 'jev-1.13.0' }),
    );
    vi.stubGlobal('fetch', fetch);
    const start = parseUpdatedGame(localStart());

    const updated = await sendMove('local', start, null, {
      goat: { type: 'jev' },
      tiger: { type: 'human' },
    } as any);

    expect(updated.remoteMove).toEqual(List([12]));
    expect(updated.playerNum).toBe(2);
    expect(updated.numGoatsToPlace).toBe(19);
    expect(updated.history.last()?.get(1)?.has(12)).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      '/api/jev',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('rejects a move not present in the local engine legal moves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ move: [0], confidence: 1, model: 'bad' })),
    );
    const start = parseUpdatedGame(localStart());

    await expect(
      sendMove('local', start, null, {
        goat: { type: 'jev' },
        tiger: { type: 'human' },
      } as any),
    ).rejects.toThrow('Jev returned an illegal move');
  });
});
