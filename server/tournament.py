"""Self-play tournament over the human-replicable strategies.

Every goat strategy plays every tiger strategy over many seeded games; we rank
each side by how it performs against the whole opposing field. Results are
reproducible: the only randomness is a per-game seeded RNG used to break ties
between equally-good moves.
"""

import random
from collections import defaultdict

from .constants import GOAT_PLAYER
from .game import TigerAndGoat
from .strategies import GOAT_STRATEGIES, TIGER_STRATEGIES

MAX_PLIES = 200


def play_game(goat_strategy, tiger_strategy, seed, max_plies=MAX_PLIES):
    """Play one game; return 'goat', 'tiger', or 'draw'."""
    game = TigerAndGoat([None, None])
    rng = random.Random(seed)

    for _ in range(max_plies):
        if game.is_over():
            break
        if game.current_player == GOAT_PLAYER:
            move = goat_strategy.choose(game, rng)
        else:
            move = tiger_strategy.choose(game, rng)
        game.play_move(move)

    result = game.get_result_name()
    if result == "tiger wins":
        return "tiger"
    if result == "goat wins":
        return "goat"
    return "draw"


def play_match(goat_strategy, tiger_strategy, games):
    """Play `games` seeded games for one pairing; return result counts."""
    counts = {"goat": 0, "tiger": 0, "draw": 0}
    for seed in range(games):
        counts[play_game(goat_strategy, tiger_strategy, seed)] += 1
    return counts


def run_tournament(games=20):
    """Return (matches, goat_ranking, tiger_ranking).

    Points are win=1, draw=0.5, loss=0. A side is ranked by its average points
    per game across the entire opposing field.
    """
    matches = {}
    goat_points = defaultdict(float)
    goat_games = defaultdict(int)
    tiger_points = defaultdict(float)
    tiger_games = defaultdict(int)

    for goat in GOAT_STRATEGIES:
        for tiger in TIGER_STRATEGIES:
            counts = play_match(goat, tiger, games)
            matches[(goat.name, tiger.name)] = counts
            total = sum(counts.values())

            goat_points[goat.name] += counts["goat"] + 0.5 * counts["draw"]
            goat_games[goat.name] += total
            tiger_points[tiger.name] += counts["tiger"] + 0.5 * counts["draw"]
            tiger_games[tiger.name] += total

    goat_ranking = _rank(GOAT_STRATEGIES, goat_points, goat_games)
    tiger_ranking = _rank(TIGER_STRATEGIES, tiger_points, tiger_games)
    return matches, goat_ranking, tiger_ranking


def _rank(strategies, points, games):
    by_name = {s.name: s for s in strategies}
    rows = [
        {
            "name": name,
            "score": points[name] / games[name],
            "description": by_name[name].description,
        }
        for name in by_name
    ]
    rows.sort(key=lambda r: r["score"], reverse=True)
    return rows


def format_report(matches, goat_ranking, tiger_ranking, games):
    lines = []
    lines.append("# Ranked playing strategies (discovered by self-play)")
    lines.append("")
    lines.append(
        f"Every goat strategy played every tiger strategy over {games} seeded "
        "games each. Each side is ranked by its average score per game against "
        "the whole opposing field (win = 1, draw = 0.5, loss = 0)."
    )
    lines.append("")
    lines.append(
        "All strategies are human-replicable: each is a rule you could follow at "
        "the board, reasoning at most one move ahead. No game-tree search is used."
    )
    lines.append("")

    for title, ranking in (("Goat", goat_ranking), ("Tiger", tiger_ranking)):
        lines.append(f"## {title} strategies, strongest first")
        lines.append("")
        lines.append("| Rank | Strategy | Score | What a human does |")
        lines.append("| --- | --- | --- | --- |")
        for i, row in enumerate(ranking, 1):
            lines.append(
                f"| {i} | `{row['name']}` | {row['score']:.3f} | {row['description']} |"
            )
        lines.append("")

    lines.append("## Head-to-head (goat win% / draw% / tiger win%)")
    lines.append("")
    tiger_names = [t.name for t in TIGER_STRATEGIES]
    header = "| goat \\ tiger | " + " | ".join(tiger_names) + " |"
    lines.append(header)
    lines.append("| --- " * (len(tiger_names) + 1) + "|")
    for goat in GOAT_STRATEGIES:
        cells = []
        for tname in tiger_names:
            c = matches[(goat.name, tname)]
            total = sum(c.values())
            cells.append(
                f"{100 * c['goat'] / total:.0f}/"
                f"{100 * c['draw'] / total:.0f}/"
                f"{100 * c['tiger'] / total:.0f}"
            )
        lines.append(f"| `{goat.name}` | " + " | ".join(cells) + " |")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    games = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    matches, goat_ranking, tiger_ranking = run_tournament(games)
    print(format_report(matches, goat_ranking, tiger_ranking, games))
