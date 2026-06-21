# Tigers and Goats

A browser implementation of Bagh-Chal (Tigers and Goats), with a Python game
server and a React client.

## Requirements

- [uv](https://docs.astral.sh/uv/)
- Node.js 20.19 or newer

## Setup

```console
uv sync
npm --prefix browser ci
```

Run the API and browser client in separate terminals:

```console
make server
make browser
```

Then open <http://localhost:3000>. The API documentation is available at
<http://localhost:8000/docs>.

## Engine: server or in-browser

The game logic exists twice: the Python engine (`server/`) and a TypeScript port
(`browser/src/engine/`) that runs entirely in the browser. The TS engine is
verified to match the Python one move-for-move by parity fixtures
(`browser/src/engine/engine.test.ts`).

An **Engine** dropdown in the UI switches between:

- **Server (Python)** — moves are computed by the API (the default in dev).
- **Local (in-browser)** — moves are computed client-side, no backend needed.

This means the client can be deployed as a **purely static site** with no
server. Build one with the local engine as the default:

```console
VITE_ENGINE=local npm --prefix browser run build
```

The contents of `browser/dist/` are then a complete, backend-free game.

## Deployment

The static build is hosted on **Cloudflare Pages** at
<https://tigergoat.tomv.uk> (and <https://tigergoat.pages.dev>).

Deploy the content (requires a wrangler login with `pages:write`):

```console
npm --prefix browser run deploy
```

This builds the local-engine bundle and uploads it to the `tigergoat` Pages
project.

DNS and the custom domain are managed with Pulumi in [`infra/`](infra/): it
looks up the existing `tomv.uk` Cloudflare zone read-only, creates the
`tigergoat.tomv.uk` CNAME, and attaches the custom domain to the Pages project.
It needs a `CLOUDFLARE_API_TOKEN` with Zone:Read, DNS:Edit and Pages:Edit:

```console
cd infra
CLOUDFLARE_API_TOKEN=<token> pulumi up
```

## Checks

```console
make test
make lint
make build
```

The Python dependencies are locked in `uv.lock`; browser dependencies are
locked in `browser/package-lock.json`.

See [TODO.md](TODO.md) for the current engineering roadmap.
