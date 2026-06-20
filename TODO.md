# Engineering roadmap

## P0 — establish reliable behavior

- Add rule-level tests for captures, the fifth-goat win, trapped tigers, draws,
  repetition, move/unmove symmetry, and state serialization round trips.
- Reject malformed or impossible board histories. The current API validates the
  request shape and requested move, but still trusts client-supplied history.
- Add browser interaction tests for placing, stepping, capturing, server errors,
  swapping sides, and game-over states.
- Add one end-to-end smoke test that starts both applications and plays a move.

## P1 — make the bot correct and responsive

- Build a small suite of tactical positions with known best moves. This should
  be the acceptance suite for any search or evaluation change.
- Benchmark representative opening, placement, and movement positions. Record
  nodes searched as well as elapsed time.
- Replace the fixed-depth request path with iterative deepening and a hard time
  budget, returning the best fully searched move.
- Add alpha-beta move ordering: winning captures, captures, transposition-table
  move, then quiet moves. Apply symmetry reduction inside search rather than to
  the public list of legal moves.
- Use a bounded transposition table shared across requests, with depth and bound
  metadata. Review the evaluation function against the tactical suite.
- Keep the HTTP request path non-blocking while the search runs.

## P1 — make animations deterministic

- Separate authoritative game state from the board state currently being
  displayed. A server response currently replaces the whole board before the
  move animation has a stable start state.
- Introduce an explicit animation sequence: local move, remote piece move,
  captured-goat removal, then commit the returned position.
- Use transform-based movement (FLIP or keyed CSS animations), with a
  `prefers-reduced-motion` path and input disabled while a remote move is pending.
- Cover placement, step, capture, and rapid-response/race cases in component
  tests. Add a touch-capable interaction path.

## P2 — simplify the architecture

- Split client code into game model, API, state, and presentation modules.
- Replace the duplicated Python/TypeScript move interpretation with a documented
  wire format and shared fixtures.
- Reassess Immutable.js and Recoil; both add conversion and state-timing
  complexity for a small board.
- Replace client-supplied complete history with server-owned game sessions if
  this moves beyond local play.
- Add CI for Python lint/tests and browser test/build checks.
