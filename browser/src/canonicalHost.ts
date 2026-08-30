const SYMBOL_HOSTNAME = 'xn--wn8hwa.tomv.uk';
const CANONICAL_ORIGIN = 'https://tigergoat.tomv.uk';

export function canonicalRedirectUrl(url: URL): string | null {
  if (url.hostname !== SYMBOL_HOSTNAME) {
    return null;
  }

  return `${CANONICAL_ORIGIN}${url.pathname}${url.search}${url.hash}`;
}
