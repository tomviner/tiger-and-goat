import random

import pytest

from server.constants import GOAT_PLAYER
from server.game import TigerAndGoat
from server.strategies import (
    EDGE_POINTS,
    GOAT_STRATEGIES,
    STRONG_POINTS,
    TIGER_STRATEGIES,
    tiger_captures,
    tiger_steps,
)
from server.tournament import play_game, run_tournament


def test_board_point_sets():
    assert STRONG_POINTS == frozenset({6, 8, 12, 16, 18})
    assert len(EDGE_POINTS) == 16


@pytest.mark.parametrize("seed", range(20))
def test_helpers_match_engine(seed):
    """tiger_captures matches the engine exactly; engine steps are a subset."""
    rng = random.Random(seed)
    squares = rng.sample(range(25), rng.randint(4, 16))
    tigers, goats = set(squares[:4]), set(squares[4:])

    game = TigerAndGoat([None, None])
    game.pieces = type(game.pieces)(tigers=tigers, goats=goats)
    game.goats_to_place = 0
    game.current_player = 2  # tiger to move
    game.history.clear()
    game.history.append(game.pieces.canonical)

    engine = set(game.possible_moves())
    assert {m for m in engine if len(m) == 3} == set(tiger_captures(tigers, goats))
    assert {m for m in engine if len(m) == 2} <= set(tiger_steps(tigers, goats))


def _play_asserting_legal(goat, tiger, seed, max_plies=200):
    game = TigerAndGoat([None, None])
    rng = random.Random(seed)
    for _ in range(max_plies):
        if game.is_over():
            break
        legal = game.possible_moves()
        chooser = goat if game.current_player == GOAT_PLAYER else tiger
        move = chooser.choose(game, rng)
        assert move in legal, f"{chooser.name} returned illegal move {move}"
        game.play_move(move)
    return game.get_result_name()


def test_every_strategy_only_plays_legal_moves():
    for goat in GOAT_STRATEGIES:
        for tiger in TIGER_STRATEGIES:
            _play_asserting_legal(goat, tiger, seed=1)


def test_play_game_is_deterministic():
    goat, tiger = GOAT_STRATEGIES[2], TIGER_STRATEGIES[3]
    assert play_game(goat, tiger, 5) == play_game(goat, tiger, 5)


def test_run_tournament_ranks_all_strategies():
    matches, goat_ranking, tiger_ranking = run_tournament(games=2)

    assert len(goat_ranking) == len(GOAT_STRATEGIES)
    assert len(tiger_ranking) == len(TIGER_STRATEGIES)
    assert len(matches) == len(GOAT_STRATEGIES) * len(TIGER_STRATEGIES)

    for ranking in (goat_ranking, tiger_ranking):
        scores = [row["score"] for row in ranking]
        assert scores == sorted(scores, reverse=True)
        assert all(0.0 <= s <= 1.0 for s in scores)
