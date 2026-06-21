"""Expanded tournament: the human-replicable strategies plus the Negamax search
AI at a range of depths, rated with Elo.

Every goat competitor plays every tiger competitor. Strategies break ties with a
seeded RNG (so repeated games vary); the search AI is deterministic, so any
AI-vs-AI pairing is played once and its result replicated. Elo is computed over
the full set of (goat, tiger, result) games — a single scale on which goats and
tigers are rated against each other, so the goat/tiger imbalance shows up
directly and each side is also ranked internally.
"""

import json
import random
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from easyAI import Negamax
from easyAI.AI import TranspositionTable

from .constants import GOAT_PLAYER, TIGER_PLAYER
from .strategies import GOAT_STRATEGIES, TIGER_STRATEGIES
from .tournament import play_game

AI_DEPTHS = [1, 2, 3, 4, 5, 6]
GAMES = 7


def side_name(side: int) -> str:
    return "goat" if side == GOAT_PLAYER else "tiger"


@dataclass
class Competitor:
    name: str
    side: int
    kind: str  # "strategy" | "ai"
    description: str
    deterministic: bool
    choose: Callable  # (game, rng) -> move
    depth: int | None = None

    @property
    def key(self) -> str:
        return f"{side_name(self.side)}:{self.name}"


def _ai_competitor(side: int, depth: int) -> Competitor:
    # One searcher per competitor, with a transposition table reused across its
    # games for speed (the evaluation is deterministic, so cached values stay
    # valid between games).
    searcher = Negamax(depth, tt=TranspositionTable())
    return Competitor(
        name=f"ai-depth-{depth}",
        side=side,
        kind="ai",
        description=f"Negamax alpha-beta search to depth {depth}.",
        deterministic=True,
        choose=lambda game, _rng: searcher(game),
        depth=depth,
    )


def build_competitors(depths=AI_DEPTHS):
    def from_strategy(strategy):
        return Competitor(
            name=strategy.name,
            side=strategy.side,
            kind="strategy",
            description=strategy.description,
            deterministic=False,
            choose=strategy.choose,
        )

    goats = [from_strategy(s) for s in GOAT_STRATEGIES]
    goats += [_ai_competitor(GOAT_PLAYER, d) for d in depths]
    tigers = [from_strategy(s) for s in TIGER_STRATEGIES]
    tigers += [_ai_competitor(TIGER_PLAYER, d) for d in depths]
    return goats, tigers


def match_results(goat: Competitor, tiger: Competitor, games: int) -> list[str]:
    """Return a list of 'goat'/'tiger'/'draw', one per game."""
    if goat.deterministic and tiger.deterministic:
        # The whole game is deterministic; play once and replicate.
        return [play_game(goat, tiger, 0)] * games
    return [play_game(goat, tiger, seed) for seed in range(games)]


def compute_elo(keys, games, epochs=80, k=24, base=1500, seed=0):
    """Iterative Elo over (goat_key, tiger_key, result) games."""
    rating = {key: float(base) for key in keys}
    rng = random.Random(seed)
    order = list(range(len(games)))
    for _ in range(epochs):
        rng.shuffle(order)
        for i in order:
            gkey, tkey, result = games[i]
            ra, rb = rating[gkey], rating[tkey]
            expected_goat = 1.0 / (1.0 + 10 ** ((rb - ra) / 400.0))
            score_goat = 1.0 if result == "goat" else 0.5 if result == "draw" else 0.0
            rating[gkey] += k * (score_goat - expected_goat)
            rating[tkey] += k * ((1.0 - score_goat) - (1.0 - expected_goat))
    return rating


def run_elo_tournament(games=GAMES, depths=AI_DEPTHS):
    goats, tigers = build_competitors(depths)
    all_games: list[tuple[str, str, str]] = []

    for goat in goats:
        for tiger in tigers:
            for result in match_results(goat, tiger, games):
                all_games.append((goat.key, tiger.key, result))

    keys = [c.key for c in (*goats, *tigers)]
    elo = compute_elo(keys, all_games)

    def rows(competitors, win_label):
        out = []
        for c in competitors:
            played = [g for g in all_games if c.key in (g[0], g[1])]
            wins = sum(1 for g in played if g[2] == win_label)
            draws = sum(1 for g in played if g[2] == "draw")
            losses = len(played) - wins - draws
            out.append(
                {
                    "name": c.name,
                    "kind": c.kind,
                    "depth": c.depth,
                    "description": c.description,
                    "elo": round(elo[c.key]),
                    "wins": wins,
                    "draws": draws,
                    "losses": losses,
                    "games": len(played),
                }
            )
        out.sort(key=lambda r: r["elo"], reverse=True)
        return out

    return {
        "games": games,
        "depths": depths,
        "totalGames": len(all_games),
        "goat": rows(goats, "goat"),
        "tiger": rows(tigers, "tiger"),
    }


if __name__ == "__main__":
    import sys

    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    data = run_elo_tournament()
    text = json.dumps(data, indent=2)
    if out_path:
        out_path.write_text(text + "\n")
        print(f"wrote {out_path} ({data['totalGames']} games)")
    else:
        print(text)
