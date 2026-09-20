import { afterEach, describe, expect, test, vi } from 'vitest';
import { getJevMove } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('getJevMove', () => {
  test('reports a useful error when Cloudflare returns a non-JSON error page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<!DOCTYPE html><title>Bad gateway</title>', {
            status: 502,
            headers: { 'content-type': 'text/html' },
          }),
      ),
    );

    await expect(
      getJevMove({ playerNum: 1, numGoatsToPlace: 20, history: [] }, [[12]]),
    ).rejects.toThrow('Jev service unavailable (502)');
  });
});
