# Progress Log

## Snapshot taken

- Repo modernization is underway on top of `main`.
- Python backend has been moved to a root-level `uv` project with `pytest`
  tests under `tests/`.
- Browser client has been migrated to Vite/Vitest/React 18.
- The server now uses FastAPI and validates client-supplied game state more
  strictly than before.
- The current roadmap lives in [`TODO.md`](TODO.md).

## Completed so far

- Reworked the Python package layout and imports.
- Removed the old per-server packaging files.
- Added browser build/test tooling and updated the app shell.
- Added backend and frontend test coverage for the new baseline.
- Documented the current engineering roadmap in `TODO.md`.

## Remaining work

- Fix the animation pipeline so remote moves render deterministically.
- Improve bot strength and responsiveness.
- Add rule-level and end-to-end tests for the remaining edge cases.
- Decide whether the client should keep sending complete history or switch to
  server-owned sessions later.

## Branching

- The next working branch should preserve this modernization baseline so the
  repo can evolve without losing the current snapshot.
