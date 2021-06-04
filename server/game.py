import time
from collections import deque

from easyAI import AI_Player, Negamax, TwoPlayersGame
from easyAI.AI import TT
from funcy import collecting

from board import display
from constants import (
    GOAT_CHAR,
    GOAT_PLAYER,
    NUM_EATEN_LOSE,
    NUM_GOATS,
    STARTING_TIGERS,
    TIGER_CHAR,
    TIGER_PLAYER,
)
from graph import JUMPS_GRAPH, STEPS_GRAPH
from ls import log
from notations import ALL_POS_NUMS, notation_to_pos_num, pos_num_to_notation
from pieces import Pieces


def apply_move(coords, pieces):
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


def unapply_move(coords, pieces):
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


class TigerAndGoat(TwoPlayersGame):
    history_max_len = 20

    def __init__(self, players):
        self.players = players
        self.pieces = self.initial_pieces()
        self.goats_to_place = NUM_GOATS
        # goat always starts
        self.nplayer = GOAT_PLAYER
        # check for repetition against the most recent states.
        # just far back enough to prevent endless loops.
        # AI lookahead will append and then pop (upon unmove), so this must be sized as
        # "enough history" + AI lookahead depth
        self.history = deque([self.pieces.canonical], maxlen=self.history_max_len)

    def ttentry(self, json_safe=False):
        """Game state consists of:
        - current player name
        - number of goats left to place
        - possibly truncated piece position history, always at least 1 turn back
            - while still placing goats just keep 1 turn, as move loops won't last
        """
        history = (self.history[-1],) if self.goats_to_place else tuple(self.history)
        if json_safe:
            history = tuple(list(map(list, pieces)) for pieces in history)
        return (self.nplayer, self.goats_to_place, history)

    def as_dict(self):
        nplayer, goats_to_place, history = self.ttentry()
        tigers, goats = history[-1]

        return {
            'playerNum': nplayer,
            'numGoatsToPlace': goats_to_place,
            'possibleMoves': self.possible_moves(),
            'history': history,
            'tigers': sorted(tigers),
            'goats': sorted(goats),
        }

    def ttrestore(self, entry):
        self.nplayer, self.goats_to_place, history = entry

        canonical = history[-1]

        self.pieces = Pieces(*canonical)
        self.history = deque(history, maxlen=self.history_max_len)

    def initial_pieces(self):
        # tigers in corner positions
        return Pieces(tigers=STARTING_TIGERS)

    def pretty_move(self, pos_nums):
        return pos_num_to_notation(pos_nums)

    def parse_move(self, move):
        try:
            return notation_to_pos_num(move)
        except ValueError:
            raise

    @log
    def make_move(self, coords):
        apply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place -= 1
        self.history.append(self.pieces.canonical)

    @log
    def unmake_move(self, coords):
        unapply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place += 1
        self.history.pop()

    def tigers_go(self):
        return self.nplayer == TIGER_PLAYER

    def goats_go(self):
        return self.nplayer == GOAT_PLAYER

    def empty(self):
        return ALL_POS_NUMS - set(self.pieces)

    def unique_positions(self):
        "Given a single goat's rotational and mirror symmetries"
        # For placing the first goat: use the upper half of the top-left quadrant
        return {0, 1, 2, 6, 7, 12}

    def is_repeat(self, coords):
        if self.goats_to_place:
            return False
        new_pieces = self.pieces.copy()
        apply_move(coords, new_pieces)
        return new_pieces.canonical in self.history

    def get_steps(self, nodes, short_circuit=False):
        for node in nodes:
            for dest in STEPS_GRAPH[node]:
                if dest not in self.pieces:
                    coords = node, dest
                    if not self.is_repeat(coords):
                        yield coords
                        if short_circuit:
                            break

    def tiger_steps(self, short_circuit):
        yield from self.get_steps(self.pieces.inverse[TIGER_CHAR], short_circuit)

    def tiger_jumps(self, short_circuit):
        for tiger in self.pieces.tigers:
            for dest in JUMPS_GRAPH[tiger]:
                eaten = (tiger + dest) // 2
                if self.pieces.get(eaten) == GOAT_CHAR and dest not in self.pieces:
                    coords = tiger, eaten, dest
                    yield coords
                    if short_circuit:
                        break

    def mobile_tigers(self):
        return len({mv[0] for mv in self.tiger_moves(short_circuit=True)})

    def goat_placements(self):
        # first goat placed only need consider unique positions
        if self.pieces == STARTING_TIGERS:
            positions = self.unique_positions() - self.pieces.inverse[TIGER_CHAR]
        else:
            positions = self.empty()
        return [(pos,) for pos in positions]

    def goat_steps(self):
        yield from self.get_steps(self.pieces.inverse[GOAT_CHAR])

    def tiger_moves(self, short_circuit=False):
        yield from self.tiger_jumps(short_circuit)
        yield from self.tiger_steps(short_circuit)

    def goat_moves(self):
        if self.goats_to_place:
            yield from self.goat_placements()
        else:
            yield from self.goat_steps()

    @log
    @collecting
    def possible_moves(self):
        if self.tigers_go():
            yield from self.tiger_moves()
        else:
            yield from self.goat_moves()

    def goats_eaten(self):
        return NUM_GOATS - self.goats_to_place - len(self.pieces) + 4

    def tiger_wins(self):
        return self.goats_eaten() >= NUM_EATEN_LOSE

    def goat_wins(self):
        return self.tigers_go() and not self.mobile_tigers()

    def is_draw(self):
        """If tiger can't move it loses. If goat can't move, we call it a draw,
        because we'd rather not incentivise this non-decisive behaviour
        """
        if self.goats_to_place or self.tigers_go():
            return False
        return not list(self.goat_moves())

    def show(self):
        display(self.pieces, self.goats_to_place, self.goats_eaten())
        if self.tiger_wins():
            print('5 goats eaten, TIGER WINS!')
        elif self.goat_wins():
            print('tiger cannot move, GOAT WINS!')
        elif self.is_draw():
            print('goat cannot move, A DRAW!')
        score = abs(self.scoring())
        print('score:', score, 'x' * score)

    @log
    def scoring(self):
        mobile_tigers = self.mobile_tigers()
        # if tiger just made a move, history may appear to preclude the reverse move,
        # however once goat has moved, this may not be true. So don't allow tiger to
        # appear lost until it's tiger's go
        if not mobile_tigers:
            mobile_tigers = int(self.goats_go())

        if self.goats_eaten() >= NUM_EATEN_LOSE:
            score = 100
        elif not mobile_tigers:
            score = -100
        else:
            score = 10 * self.goats_eaten() + mobile_tigers
        if self.goats_go():
            score *= -1
        return score

    @log
    def is_over(self):
        return self.tiger_wins() or self.goat_wins() or self.is_draw()


if __name__ == "__main__":
    kw1, kw2 = {}, {}
    if 1:
        kw1 = {'tt': TT()}
        kw2 = {'tt': TT()}
    goat_ai = Negamax(6, **kw1)
    tiger_ai = Negamax(6, **kw2)
    game = TigerAndGoat([AI_Player(goat_ai, 'goat'), AI_Player(tiger_ai, 'tiger')])

    start = time.monotonic()
    game.play(500)

    duration = time.monotonic() - start
    move_duration = duration / game.nmove
    print('duration', f'{duration:.1f} secs, {move_duration:.2f} secs / move')

#  8: duration 172 seconds
#  9:  99 moves / 360 seconds
# 10: 166 moves / 1011 seconds
