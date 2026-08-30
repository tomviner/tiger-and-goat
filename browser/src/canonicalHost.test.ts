import { expect, test } from 'vitest';
import { canonicalRedirectUrl } from './canonicalHost';

test('redirects the emoji hostname and preserves the complete route', () => {
  const url = new URL('https://🐅🐐.tomv.uk/rules?mode=quick#captures');

  expect(canonicalRedirectUrl(url)).toBe(
    'https://tigergoat.tomv.uk/rules?mode=quick#captures',
  );
});

test('leaves the canonical hostname in place', () => {
  const url = new URL('https://tigergoat.tomv.uk/strategies');

  expect(canonicalRedirectUrl(url)).toBeNull();
});
