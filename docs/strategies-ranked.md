# Ranked, human-replicable strategies for Tigers & Goats

This follows [strategy-tournament-plan.md](strategy-tournament-plan.md). The goal
is a ranked list of strategies for each side that a **human can understand and
replicate at the board** — so the candidate strategies are explicit rules that
reason at most one move ahead (e.g. "don't place a goat where it can be jumped",
"capture but stay mobile"). No game-tree search or opaque evaluation weights are
used, by design; strategies that could not be followed by a person were never
tested.

Strategies live in [`server/strategies.py`](../server/strategies.py); the
self-play tournament that ranks them is
[`server/tournament.py`](../server/tournament.py).

## Key takeaways

**Tigers are heavily favoured against simple human heuristics.** Any tiger rule
that captures whenever possible scores above 0.9 against the goat field; the
random tiger scores only ~0.55. Lesson for a human tiger player: **always take a
capture, and when you can't, keep your tigers central and mobile** so you never
trap yourself. The strongest tested tiger, `tiger-centre-control`, edges out pure
greed by steering tigers toward the strong central points between captures.

**For goats, playing the rim is the single biggest idea.** `goat-safe-edge`
is far ahead of every other goat strategy — and it is the only one that earns
**draws against the top tigers**, not just wins against weak ones. Goats on the
perimeter are hard to jump (an edge point offers a tiger fewer squares to land
on), so a rim wall stalls the tigers into a draw. Lesson for a human goat player:
**never offer a free jump, and build your wall from the edges inward.**

**"Safe" alone is not enough for goats.** A goat that merely avoids immediate
captures but otherwise moves at random (`goat-safe`) still loses almost every
game: it survives the placement phase, then gets ground down in the movement
phase as the tiger manoeuvres into *new* captures it didn't look far enough ahead
to see. Goats must *actively* restrict the tigers (edge walls, connectivity,
hemming them in), not just dodge one move at a time.

## Goat strategies, strongest first

| Rank | Strategy | Score | What a human does |
| --- | --- | --- | --- |
| 1 | `goat-safe-edge` | 0.340 | Among safe moves, build from the rim — prefer perimeter squares, which give tigers fewer places to land; break ties by staying connected. |
| 2 | `goat-safe-connected` | 0.156 | Among safe moves, keep goats touching each other — pick the move whose goat ends up next to the most friendly goats, building a solid wall. |
| 3 | `goat-safe-block` | 0.144 | Among safe moves, choose the one that leaves the tigers with the fewest moves — hem the tigers in while never offering a capture. |
| 4 | `goat-safe-strong-points` | 0.132 | Among safe moves, grab the strong central points first (the most connected squares); break ties by hemming the tigers in. |
| 5 | `goat-safe` | 0.050 | Never put a goat where a tiger could jump it next turn; otherwise pick freely among the safe moves. |
| 6 | `goat-random` | 0.004 | Play a random legal move (placement or step). Baseline. |

## Tiger strategies, strongest first

| Rank | Strategy | Score | What a human does |
| --- | --- | --- | --- |
| 1 | `tiger-centre-control` | 0.957 | Capture when possible; otherwise march tigers toward the strong central points, controlling the board's busiest lines. |
| 2 | `tiger-mobile-capture` | 0.953 | Always capture when possible, but pick the capture (and otherwise the step) that keeps the tigers with the most moves — eat without trapping yourself. |
| 3 | `tiger-threat-builder` | 0.942 | Capture when possible; otherwise move to threaten the most goats next turn, setting up jumps (including forks the goat can't fully answer). |
| 4 | `tiger-greedy-capture` | 0.907 | Always take a capture when one exists (any of them); otherwise step at random. The simple 'eat whenever you can' instinct. |
| 5 | `tiger-random` | 0.553 | Play a random legal move, capture or not. Baseline. |

## Head-to-head (goat win% / draw% / tiger win%)

| goat \ tiger | tiger-random | tiger-greedy-capture | tiger-mobile-capture | tiger-threat-builder | tiger-centre-control |
| --- | --- | --- | --- | --- | --- |
| `goat-random` | 2/0/98 | 0/0/100 | 0/0/100 | 0/0/100 | 0/0/100 |
| `goat-safe` | 24/2/74 | 0/0/100 | 0/0/100 | 0/0/100 | 0/0/100 |
| `goat-safe-block` | 60/0/40 | 10/0/90 | 2/0/98 | 0/0/100 | 0/0/100 |
| `goat-safe-connected` | 54/16/30 | 14/0/86 | 0/0/100 | 0/0/100 | 2/0/98 |
| `goat-safe-strong-points` | 64/0/36 | 2/0/98 | 0/0/100 | 0/0/100 | 0/0/100 |
| `goat-safe-edge` | 32/46/22 | 22/16/62 | 26/0/74 | 34/2/64 | 12/24/64 |


## Methodology

- Every goat strategy played every tiger strategy over **50 games**. The
  only randomness is a per-game seeded RNG that breaks ties between equally-good
  moves, so the whole tournament is reproducible.
- Each side is ranked by **average score per game against the entire opposing
  field** (win = 1, draw = 0.5, loss = 0).
- A game is a draw if it reaches 200 plies without a result (a perpetual rim
  stand-off), or if the goats are stalemated.
- Reproduce with: `uv run python -m server.tournament 50`
- Caveat: these are deliberately *simple* one-move-ahead rules. A strong human
  goat player looks further ahead than any strategy here, so the goats' poor
  showing reflects the one-ply constraint, not that goats are lost in Bagh-Chal.
