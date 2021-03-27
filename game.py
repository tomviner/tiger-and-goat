import re
import time
from collections import defaultdict
from functools import lru_cache

from easyAI import AI_Player, Human_Player, Negamax, TwoPlayersGame
from funcy import collecting, joining, post_processing

from board import display
from caching import cache
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


@cache
def apply_move(coords, pieces):
    pieces = pieces.copy()
    if len(coords) == 1:
        pos = coords[0]
        pieces[pos] = GOAT_CHAR
    elif len(coords) == 2:
        src, dest = coords
        pieces[dest] = pieces.pop(src)
    elif len(coords) == 3:
        src, eaten, dest = coords
        pieces[dest] = pieces.pop(src)
        del pieces[eaten]
    else:
        raise ValueError(coords)
    return pieces


@cache
def unapply_move(coords, pieces):
    pieces = pieces.copy()
    if len(coords) == 1:
        pos = coords[0]
        del pieces[pos]
    elif len(coords) == 2:
        src, dest = coords
        pieces[src] = pieces.pop(dest)
    elif len(coords) == 3:
        src, eaten, dest = coords
        pieces[src] = pieces.pop(dest)
        pieces[eaten] = GOAT_CHAR
    else:
        raise ValueError(coords)
    return pieces


class TigerAndGoat(TwoPlayersGame):
    def __init__(self, players):
        self.players = players
        self.goats_to_place = NUM_GOATS
        # goat always starts
        self.nplayer = GOAT_PLAYER
        self.nodes = get_nodes()
        self.pieces = {}
        self.place_tigers()
        self.history = [self.pieces]

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

    def seen(self, coords):
        if self.goats_to_place:
            return False
        new_pieces = apply_move(coords, self.pieces)
        return new_pieces in self.history

    @collecting
    def get_steps(self, nodes):
        for node in nodes:
            for dest in node.step_links:
                if dest.pos not in self.pieces:
                    coords = node.pos, dest.pos
                    if not self.seen(coords):
                        yield coords

    def tiger_steps(self):
        return self.get_steps(self.tiger_nodes())

    @collecting
    def tiger_jumps(self):
        # from collections import Counter

        # c = Counter()
        for tiger in self.tiger_nodes():
            for eaten, dest in tiger.jump_links:
                if (
                    self.pieces.get(eaten.pos) == GOAT_CHAR
                    and dest.pos not in self.pieces
                ):
                    coords = tiger.pos, eaten.pos, dest.pos
                    yield coords
        #                 c[tiger.pos] += 1
        # self.tigers_can_jump = sum(bool(count) for count in c.values())

    def mobile_tigers(self):
        # Todo: refactor this
        from collections import Counter

        c = Counter()
        for tiger in self.tiger_nodes():
            for eaten, dest in tiger.jump_links:
                if (
                    self.pieces.get(eaten.pos) == GOAT_CHAR
                    and dest.pos not in self.pieces
                ):
                    coords = tiger.pos, eaten.pos, dest.pos
                    # if not self.seen(coords):
                    c[tiger] += 1
            for dest in tiger.step_links:
                if dest.pos not in self.pieces:
                    coords = tiger.pos, dest.pos
                    if not self.seen(coords):
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
        self.pieces = apply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place -= 1
        self.history.append(self.pieces)

    def unmake_move(self, notation):
        coords = notation_to_coords(notation)
        self.pieces = unapply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place += 1
        self.history.pop()

    def goats_eaten(self):
        return NUM_GOATS - self.goats_to_place - len(self.pieces) + 4

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
        score = abs(self.scoring())
        print('score:', score, 'x' * score)

    @post_processing(coords_to_notation)
    def serialize_pieces(self):
        yield from sorted(node.pos for node in self.tiger_nodes())
        yield from sorted(node.pos for node in self.goat_nodes())

    def scoring(self):
        mobile_tigers = self.mobile_tigers()

        if self.goats_eaten() >= NUM_EATEN_LOSE:
            score = 100
        elif not mobile_tigers:
            score = 0
        else:
            score = 10 * self.goats_eaten() + mobile_tigers
        if self.goats_go():
            score *= -1
        return score


# Start a match (and store the history of moves when it ends)
goat_ai = Negamax(3)
tiger_ai = Negamax(1)
# [goat, tiger]
game = TigerAndGoat([AI_Player(goat_ai), AI_Player(tiger_ai)])

start = time.monotonic()
history = game.play()
print('duration', f'{time.monotonic() - start:.0f} seconds')
