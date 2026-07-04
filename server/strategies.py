"""Human-understandable, human-replicable playing strategies for Bagh-Chal.

Every strategy here is a rule a person could follow at the board: look at the
position, the legal moves, and reason at most one move ahead (e.g. "can this
goat be jumped next turn?", "does this keep my tigers mobile?"). No strategy
uses game-tree search or opaque evaluation weights — that is a hard constraint,
so the strategies stay explainable and reproducible by a human.

Choosing among equally-good moves uses a seeded RNG so games are reproducible.
"""

from .constants import GOAT_PLAYER, TIGER_PLAYER
from .graph import JUMPS_GRAPH, STEPS_GRAPH
from .notations import pos_num_to_coord

# The five "strong points": board points with the most connections (eight
# lines each). Controlling them is a classic human heuristic.
STRONG_POINTS = frozenset(n for n in range(25) if len(STEPS_GRAPH[n]) == 8)


def _is_edge(pos):
    x, y = pos_num_to_coord(pos)
    return x in (0, 4) or y in (0, 4)


# Perimeter points (any point on the outer ring). Fewer lines run through them,
# which limits the landing squares a tiger needs to jump.
EDGE_POINTS = frozenset(n for n in range(25) if _is_edge(n))

CENTRE = pos_num_to_coord(12)


def _manhattan_to_centre(pos):
    x, y = pos_num_to_coord(pos)
    return abs(x - CENTRE[0]) + abs(y - CENTRE[1])


# --- pure position helpers (mirror server/game.py move rules) -----------------


def tiger_captures(tigers, goats):
    """All immediate tiger jump-captures as (src, eaten, dest) tuples."""
    occupied = tigers | goats
    moves = []
    for t in tigers:
        for d in JUMPS_GRAPH[t]:
            eaten = (t + d) // 2
            if eaten in goats and d not in occupied:
                moves.append((t, eaten, d))
    return moves


def tiger_steps(tigers, goats):
    """All immediate tiger single steps as (src, dest) tuples."""
    occupied = tigers | goats
    moves = []
    for t in tigers:
        for d in STEPS_GRAPH[t]:
            if d not in occupied:
                moves.append((t, d))
    return moves


def tiger_mobility(tigers, goats):
    return len(tiger_captures(tigers, goats)) + len(tiger_steps(tigers, goats))


def num_capturable(tigers, goats):
    """How many capture moves the tiger side has right now."""
    return len(tiger_captures(tigers, goats))


def apply_to_sets(move, tigers, goats):
    """Return (tigers, goats) sets after applying a move tuple."""
    t, g = set(tigers), set(goats)
    if len(move) == 1:
        g.add(move[0])
    elif len(move) == 2:
        src, dest = move
        if src in t:
            t.discard(src)
            t.add(dest)
        else:
            g.discard(src)
            g.add(dest)
    else:
        src, eaten, dest = move
        t.discard(src)
        t.add(dest)
        g.discard(eaten)
    return t, g


def goat_dest(move):
    """The square a goat ends up on for a placement (len 1) or step (len 2)."""
    return move[0] if len(move) == 1 else move[1]


# --- strategy base ------------------------------------------------------------


class Strategy:
    name = "base"
    side = None  # GOAT_PLAYER or TIGER_PLAYER
    description = ""

    def choose(self, game, rng):  # pragma: no cover - overridden
        raise NotImplementedError

    def __repr__(self):
        return self.name


def _argbest(items, key, rng):
    """Pick the item with the max key, breaking ties with the seeded rng."""
    best = None
    best_keys = []
    for item in items:
        k = key(item)
        if best is None or k > best:
            best = k
            best_keys = [item]
        elif k == best:
            best_keys.append(item)
    return rng.choice(best_keys)


# --- goat strategies ----------------------------------------------------------


class GoatStrategy(Strategy):
    side = GOAT_PLAYER

    def safe_moves(self, game, moves):
        """Moves that do not hand the tiger a new capture next turn."""
        tigers, goats = game.pieces.tigers, game.pieces.goats
        before = num_capturable(tigers, goats)
        safe = []
        for move in moves:
            nt, ng = apply_to_sets(move, tigers, goats)
            if num_capturable(nt, ng) <= before:
                safe.append(move)
        return safe or list(moves)

    def prefer(self, game, moves, rng):  # default: random among the pool
        return rng.choice(moves)

    def choose(self, game, rng):
        moves = game.possible_moves()
        return self.prefer(game, self.safe_moves(game, moves), rng)


class GoatRandom(GoatStrategy):
    name = "goat-random"
    description = "Play a random legal move (placement or step). Baseline."

    def safe_moves(self, game, moves):  # ignores safety
        return list(moves)


class GoatSafe(GoatStrategy):
    name = "goat-safe"
    description = (
        "Never put a goat where a tiger could jump it next turn; otherwise pick "
        "freely among the safe moves."
    )


class GoatSafeBlock(GoatStrategy):
    name = "goat-safe-block"
    description = (
        "Among safe moves, choose the one that leaves the tigers with the fewest "
        "moves — hem the tigers in while never offering a capture."
    )

    def prefer(self, game, moves, rng):
        tigers, goats = game.pieces.tigers, game.pieces.goats
        return _argbest(
            moves,
            key=lambda m: -tiger_mobility(*apply_to_sets(m, tigers, goats)),
            rng=rng,
        )


class GoatSafeConnected(GoatStrategy):
    name = "goat-safe-connected"
    description = (
        "Among safe moves, keep goats touching each other — pick the move whose "
        "goat ends up next to the most friendly goats, building a solid wall."
    )

    def prefer(self, game, moves, rng):
        goats = game.pieces.goats

        def adjacency(m):
            dest = goat_dest(m)
            src = m[0] if len(m) == 2 else None
            return sum(1 for nb in STEPS_GRAPH[dest] if nb in goats and nb != src)

        return _argbest(moves, key=adjacency, rng=rng)


class GoatSafeStrong(GoatStrategy):
    name = "goat-safe-strong-points"
    description = (
        "Among safe moves, grab the strong central points first (the most "
        "connected squares); break ties by hemming the tigers in."
    )

    def prefer(self, game, moves, rng):
        tigers, goats = game.pieces.tigers, game.pieces.goats
        return _argbest(
            moves,
            key=lambda m: (
                goat_dest(m) in STRONG_POINTS,
                -tiger_mobility(*apply_to_sets(m, tigers, goats)),
            ),
            rng=rng,
        )


class GoatSafeEdge(GoatStrategy):
    name = "goat-safe-edge"
    description = (
        "Among safe moves, build from the rim — prefer perimeter squares, which "
        "give tigers fewer places to land; break ties by staying connected."
    )

    def prefer(self, game, moves, rng):
        goats = game.pieces.goats

        def key(m):
            dest = goat_dest(m)
            src = m[0] if len(m) == 2 else None
            adj = sum(1 for nb in STEPS_GRAPH[dest] if nb in goats and nb != src)
            return (dest in EDGE_POINTS, adj)

        return _argbest(moves, key=key, rng=rng)


# --- tiger strategies ---------------------------------------------------------


class TigerStrategy(Strategy):
    side = TIGER_PLAYER

    def choose(self, game, rng):
        moves = game.possible_moves()
        captures = [m for m in moves if len(m) == 3]
        steps = [m for m in moves if len(m) == 2]
        return self.pick(game, captures, steps, rng)

    def pick(self, game, captures, steps, rng):  # pragma: no cover - overridden
        raise NotImplementedError

    def best_capture(self, game, captures, rng):
        """Default capture choice: eat, keeping the most tiger mobility."""
        tigers, goats = game.pieces.tigers, game.pieces.goats
        return _argbest(
            captures,
            key=lambda m: tiger_mobility(*apply_to_sets(m, tigers, goats)),
            rng=rng,
        )


class TigerRandom(TigerStrategy):
    name = "tiger-random"
    description = "Play a random legal move, capture or not. Baseline."

    def pick(self, game, captures, steps, rng):
        return rng.choice(captures + steps)


class TigerGreedyCapture(TigerStrategy):
    name = "tiger-greedy-capture"
    description = (
        "Always take a capture when one exists (any of them); otherwise step at "
        "random. The simple 'eat whenever you can' instinct."
    )

    def pick(self, game, captures, steps, rng):
        if captures:
            return rng.choice(captures)
        return rng.choice(steps)


class TigerMobileCapture(TigerStrategy):
    name = "tiger-mobile-capture"
    description = (
        "Always capture when possible, but pick the capture (and otherwise the "
        "step) that keeps the tigers with the most moves — eat without trapping "
        "yourself."
    )

    def pick(self, game, captures, steps, rng):
        tigers, goats = game.pieces.tigers, game.pieces.goats
        if captures:
            return self.best_capture(game, captures, rng)
        return _argbest(
            steps,
            key=lambda m: tiger_mobility(*apply_to_sets(m, tigers, goats)),
            rng=rng,
        )


class TigerThreatBuilder(TigerStrategy):
    name = "tiger-threat-builder"
    description = (
        "Capture when possible; otherwise move to threaten the most goats next "
        "turn, setting up jumps (including forks the goat can't fully answer)."
    )

    def pick(self, game, captures, steps, rng):
        tigers, goats = game.pieces.tigers, game.pieces.goats
        if captures:
            return self.best_capture(game, captures, rng)
        return _argbest(
            steps,
            key=lambda m: (
                num_capturable(*apply_to_sets(m, tigers, goats)),
                tiger_mobility(*apply_to_sets(m, tigers, goats)),
            ),
            rng=rng,
        )


class TigerCentreControl(TigerStrategy):
    name = "tiger-centre-control"
    description = (
        "Capture when possible; otherwise march tigers toward the strong central "
        "points, controlling the board's busiest lines."
    )

    def pick(self, game, captures, steps, rng):
        if captures:
            return self.best_capture(game, captures, rng)
        return _argbest(
            steps,
            key=lambda m: (m[1] in STRONG_POINTS, -_manhattan_to_centre(m[1])),
            rng=rng,
        )


# --- registries ---------------------------------------------------------------

GOAT_STRATEGIES = [
    GoatRandom(),
    GoatSafe(),
    GoatSafeBlock(),
    GoatSafeConnected(),
    GoatSafeStrong(),
    GoatSafeEdge(),
]

TIGER_STRATEGIES = [
    TigerRandom(),
    TigerGreedyCapture(),
    TigerMobileCapture(),
    TigerThreatBuilder(),
    TigerCentreControl(),
]
