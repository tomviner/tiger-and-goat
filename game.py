import time

from easyAI import AI_Player, Negamax, TwoPlayersGame
from funcy import collecting, post_processing

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
from graph import get_graphs
from notations import coords_to_notation, notation_to_pos_num, pos_num_to_notation


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
        self.board_graphs = get_graphs()
        self.pieces = {}
        self.place_tigers()
        self.history = [self.pieces]
        self.all_pos_nums = set(range(25))

    def place_tigers(self):
        # corner positions
        self.pieces.update(dict.fromkeys([0, 4, 20, 24], TIGER_CHAR))

    def tigers_go(self):
        return self.nplayer == TIGER_PLAYER

    def goats_go(self):
        return self.nplayer == GOAT_PLAYER

    def empty(self):
        return self.all_pos_nums - set(self.pieces)

    def unique_positions(self):
        "Given rotational and mirror symmetries"
        # use the upper half of the top-left quadrant
        return {0, 1, 2, 6, 7, 12}

    def tiger_nodes(self):
        return [pos for pos, piece in self.pieces.items() if piece == TIGER_CHAR]

    def goat_nodes(self):
        return [pos for pos, piece in self.pieces.items() if piece == GOAT_CHAR]

    def seen(self, coords):
        if self.goats_to_place:
            return False
        new_pieces = apply_move(coords, self.pieces)
        # check for repetition against the most recent states.
        # just far back enough to prevent AI infinite loops
        return new_pieces in self.history[-4:]

    @collecting
    def get_steps(self, nodes):
        for node in nodes:
            for dest in self.board_graphs['steps'][node]:
                if dest not in self.pieces:
                    coords = node, dest
                    if not self.seen(coords):
                        yield coords

    def tiger_steps(self):
        return self.get_steps(self.tiger_nodes())

    @collecting
    def tiger_jumps(self):
        # from collections import Counter

        # c = Counter()
        for tiger in self.tiger_nodes():
            for dest in self.board_graphs['jumps'][tiger]:
                eaten = (tiger + dest) // 2
                if self.pieces.get(eaten) == GOAT_CHAR and dest not in self.pieces:
                    coords = tiger, eaten, dest
                    yield coords
        #                 c[tiger] += 1
        # self.tigers_can_jump = sum(bool(count) for count in c.values())

    def mobile_tigers(self):
        # Todo: refactor this
        from collections import Counter

        c = Counter()
        for tiger in self.tiger_nodes():
            for dest in self.board_graphs['jumps'][tiger]:
                eaten = (tiger + dest) // 2
                if self.pieces.get(eaten) == GOAT_CHAR and dest not in self.pieces:
                    coords = tiger, eaten, dest
                    # if not self.seen(coords):
                    c[tiger] += 1
            for dest in self.board_graphs['steps'][tiger]:
                if dest not in self.pieces:
                    coords = tiger, dest
                    if not self.seen(coords):
                        c[tiger] += 1
        return sum(bool(count) for count in c.values())

    def goat_placements(self):
        if not len(self.history):
            positions = self.unique_positions() - set(self.pieces)
        else:
            positions = self.empty()
        return [(pos,) for pos in positions]

    def goat_steps(self):
        return self.get_steps(self.goat_nodes())

    def possible_moves(self):
        return [move for move in self._possible_moves()]

    def pretty_move(self, pos_nums):
        return pos_num_to_notation(pos_nums)

    def parse_move(self, move):
        try:
            return notation_to_pos_num(move)
        except ValueError:
            pass

    def tiger_moves(self):
        yield from self.tiger_jumps()
        yield from self.tiger_steps()

    def _possible_moves(self):
        if self.tigers_go():
            yield from self.tiger_moves()
        else:
            if self.goats_to_place:
                yield from self.goat_placements()
            else:
                yield from self.goat_steps()

    def make_move(self, coords):
        # coords = notation_to_coords(notation)
        self.pieces = apply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place -= 1
        self.history.append(self.pieces)

    def unmake_move(self, coords):
        # coords = notation_to_coords(notation)
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
        yield from sorted(node for node in self.tiger_nodes())
        yield from sorted(node for node in self.goat_nodes())

    def scoring(self):
        mobile_tigers = self.mobile_tigers()

        if self.goats_eaten() >= NUM_EATEN_LOSE:
            score = 100
        elif not mobile_tigers:
            score = -100
        else:
            score = 10 * self.goats_eaten() + mobile_tigers
        if self.goats_go():
            score *= -1
        return score


# Start a match (and store the history of moves when it ends)
goat_ai = Negamax(6, win_score=100)
tiger_ai = Negamax(6, win_score=100)
# [goat, tiger]
game = TigerAndGoat([AI_Player(goat_ai, 'goat'), AI_Player(tiger_ai, 'tiger')])

start = time.monotonic()
history = game.play(1000)
print('duration', f'{time.monotonic() - start:.0f} seconds')
