from easyAI import AI_Player, Human_Player, Negamax, TwoPlayersGame
from funcy import collecting

from board import display
from constants import GOAT_CHAR, GOAT_PLAYER, NUM_GOATS, TIGER_CHAR, TIGER_PLAYER
from graph import get_nodes


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
        self.pieces.update(dict.fromkeys([(0, 0), (0, 4), (4, 0), (4, 4)], TIGER_CHAR))

    def tigers_go(self):
        return self.nplayer == TIGER_PLAYER

    def goats_go(self):
        return self.nplayer == GOAT_PLAYER

    def tiger_nodes(self):
        return [self.nodes[pos] for pos, piece in self.pieces if piece == TIGER_CHAR]

    def goat_nodes(self):
        return [self.nodes[pos] for pos, piece in self.pieces if piece == GOAT_CHAR]

    @collecting
    def get_steps(self):
        for tiger in self.tiger_nodes():
            for dest in tiger.step_links:
                if dest in self.empty():
                    yield tiger.pos, dest

    def tiger_steps(self):
        return self.get_steps(self.tiger_nodes())

    @collecting
    def tiger_jumps(self):
        for tiger in self.tiger_nodes():
            for eaten, dest in tiger.jump_links:
                if eaten in self.goat_nodes() and dest in self.empty():
                    yield tiger.pos, dest

    def goat_steps(self):
        return self.get_steps(self.tiger_nodes())

    def empty(self):
        return set(self.nodes) - set(self.pieces.values())

    @collecting
    def possible_moves(self):
        if self.tigers_go():
            yield from self.tiger_steps()
            yield from self.tiger_jumps()
        else:
            if self.goats_to_place:
                yield from self.empty()
            else:
                yield from self.goat_steps()

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
