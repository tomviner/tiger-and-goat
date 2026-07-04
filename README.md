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

## Checks

```console
make test
make lint
make build
```

The Python dependencies are locked in `uv.lock`; browser dependencies are
locked in `browser/package-lock.json`.

See [TODO.md](TODO.md) for the current engineering roadmap.
