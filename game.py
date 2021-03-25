import re
import time

from easyAI import AI_Player, Human_Player, Negamax, TwoPlayersGame
from funcy import collecting, joining

from board import display
from constants import (
    GOAT_CHAR,
    GOAT_PLAYER,
    NUM_EATEN_LOSE,
    NUM_GOATS,
    TIGER_CHAR,
    TIGER_PLAYER,
)
from graph import get_nodes


@collecting
def notation_to_coords(s):
    """
    Placement: A1
    Step: A1-A2
    Jump: A1-A2-A3
    """
    for notation in re.split(r'[- ]+', s):
        col, row = notation
        yield 'ABCDE'.index(col.upper()), int(row) - 1


@joining('-')
def coords_to_notation(coords):
    for x, y in coords:
        col = 'ABCDE'[x]
        row = y + 1
        yield f'{col}{row}'


class TigerAndGoat(TwoPlayersGame):
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

    def empty(self):
        return set(self.nodes) - set(self.pieces)

    def tiger_nodes(self):
        return [
            self.nodes[pos] for pos, piece in self.pieces.items() if piece == TIGER_CHAR
        ]

    def goat_nodes(self):
        return [
            self.nodes[pos] for pos, piece in self.pieces.items() if piece == GOAT_CHAR
        ]

    @collecting
    def get_steps(self, nodes):
        for node in nodes:
            for dest in node.step_links:
                if dest.pos in self.empty():
                    yield node.pos, dest.pos

    def tiger_steps(self):
        return self.get_steps(self.tiger_nodes())

    @collecting
    def tiger_jumps(self):
        for tiger in self.tiger_nodes():
            for eaten, dest in tiger.jump_links:
                if eaten in self.goat_nodes() and dest.pos in self.empty():
                    yield tiger.pos, eaten.pos, dest.pos

    def mobile_tigers(self):
        # Todo: refactor this
        from collections import Counter

        c = Counter()
        for tiger in self.tiger_nodes():
            for eaten, dest in tiger.jump_links:
                if eaten in self.goat_nodes() and dest.pos in self.empty():
                    c[tiger] += 1
            for dest in tiger.step_links:
                if dest.pos in self.empty():
                    c[tiger] += 1
        return sum(bool(count) for count in c.values())

    def goat_placements(self):
        return [(pos,) for pos in self.empty()]

    def goat_steps(self):
        return self.get_steps(self.goat_nodes())

    def possible_moves(self):
        return [coords_to_notation(move) for move in self._possible_moves()]

    def tiger_moves(self):
        yield from self.tiger_steps()
        yield from self.tiger_jumps()

    def _possible_moves(self):
        if self.tigers_go():
            yield from self.tiger_moves()
        else:
            if self.goats_to_place:
                yield from self.goat_placements()
            else:
                yield from self.goat_steps()

    def make_move(self, notation):
        coords = notation_to_coords(notation)
        if len(coords) == 1:
            pos = coords[0]
            assert pos in self.empty()
            self.pieces[pos] = GOAT_CHAR
            self.goats_to_place -= 1
        elif len(coords) == 2:
            src, dest = coords
            assert src not in self.empty()
            assert dest in self.empty()
            self.pieces[dest] = self.pieces.pop(src)
        elif len(coords) == 3:
            src, eaten, dest = coords
            assert self.pieces[src] == TIGER_CHAR
            assert self.pieces[eaten] == GOAT_CHAR
            assert dest in self.empty()
            self.pieces[dest] = self.pieces.pop(src)
            del self.pieces[eaten]
        else:
            raise ValueError(coords)

    def unmake_move(self, notation):
        coords = notation_to_coords(notation)
        if len(coords) == 1:
            pos = coords[0]
            del self.pieces[pos]
            self.goats_to_place += 1
        elif len(coords) == 2:
            src, dest = coords
            self.pieces[src] = self.pieces.pop(dest)
        elif len(coords) == 3:
            src, eaten, dest = coords
            self.pieces[src] = self.pieces.pop(dest)
            self.pieces[eaten] = GOAT_CHAR
        else:
            raise ValueError(coords)

    def goats_eaten(self):
        return NUM_GOATS - self.goats_to_place - len(self.goat_nodes())

    def tiger_wins(self):
        return self.goats_eaten() >= NUM_EATEN_LOSE

    def goat_wins(self):
        return not list(self.tiger_moves())

    def is_over(self):
        return self.tiger_wins() or self.goat_wins()

    def show(self):
        display(self.pieces, self.goats_to_place, self.goats_eaten())
        if self.tiger_wins():
            print('5 goats eaten, TIGER WINS!')
        elif self.goat_wins():
            print('tiger cannot move, GOAT WINS!')

    def scoring(self):
        score = 2 * self.goats_eaten() + self.mobile_tigers()
        if self.goats_go():
            score *= -1
        return score


# Start a match (and store the history of moves when it ends)
goat_ai = Negamax(4)
tiger_ai = Negamax(2)
# [goat, tiger]
game = TigerAndGoat([AI_Player(goat_ai), AI_Player(tiger_ai)])
print(game)

start = time.monotonic()
history = game.play()
print('duration', f'{time.monotonic() - start:.0f} seconds')
