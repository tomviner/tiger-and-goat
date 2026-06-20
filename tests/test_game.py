from easyAI import Human_Player

from server.constants import GOAT_PLAYER, TIGER_PLAYER
from server.game import TigerAndGoat


def make_game():
    return TigerAndGoat([Human_Player("goat"), Human_Player("tiger")])


def test_all_empty_squares_are_valid_opening_placements():
    game = make_game()
    assert game.current_player == GOAT_PLAYER
    assert game.possible_moves() == [
        (position,) for position in range(25) if position not in {0, 4, 20, 24}
    ]


def test_tiger_win_has_terminal_score():
    game = make_game()
    game.goats_to_place = 15
    game.current_player = TIGER_PLAYER
    assert game.tiger_wins()
    assert game.scoring() == 100


def test_goat_win_has_terminal_score():
    game = make_game()
    game.goats_to_place = 0
    game.pieces.goats.update(set(range(25)) - game.pieces.tigers)
    game.current_player = TIGER_PLAYER
    assert game.goat_wins()
    assert game.scoring() == -100
