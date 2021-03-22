from easyAI import TwoPlayersGame, Human_Player, AI_Player, Negamax
from funcy import collecting

from graph import get_nodes
from board import display
from constants import TIGER_CHAR, TIGER_PLAYER, GOAT_PLAYER, NUM_GOATS


class TigerAndGoat(TwoPlayersGame):
    """In turn, the players remove one, two or three bones from a
    pile of bones. The player who removes the last bone loses."""

    def __init__(self, players):
        self.players = players
        self.goats_to_place = NUM_GOATS
        # goat always starts
        self.nplayer = GOAT_PLAYER
        self.nodes = get_nodes()
        self.pieces = {}
        self.place_tigers()

    def place_tigers(self):
        self.pieces.update(
            dict.fromkeys([(0, 0), (0, 4), (4, 0), (4, 4)], TIGER_CHAR)
        )

    @property
    def tigers_go(self):
        return self.nplayer == TIGER_PLAYER

    @property
    def goats_go(self):
        return self.nplayer == GOAT_PLAYER

    @collecting
    def possible_moves(self):
        if self.tigers_go:
            yield from self.tiger_steps()
            yield from self.tiger_jumps()
        else:
            if self.goats_to_place:
                yield from self.empty()
            else:
                yield from self.tiger_steps()

    def make_move(self, move):
        self.pile -= int(move)  # remove bones.

    def win(self):
        return self.pile <= 0  # opponent took the last bone ?

    def is_over(self):
        return self.win()  # Game stops when someone wins.

    def show(self):
        display(self.pieces)

    def scoring(self):
        return 100 if game.win() else 0  # For the AI


# Start a match (and store the history of moves when it ends)
ai = Negamax(2)  # The AI will think n moves in advance
game = TigerAndGoat([Human_Player(), AI_Player(ai)])
history = game.play()
