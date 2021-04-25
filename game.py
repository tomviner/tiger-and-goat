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
    TIGER_CHAR,
    TIGER_PLAYER,
)
from graph import JUMPS_GRAPH, STEPS_GRAPH
from notations import ALL_POS_NUMS, notation_to_pos_num, pos_num_to_notation


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


def split_nodes(pieces):
    tigers, goats = [], []
    for pos_num, piece in sorted(pieces.items()):
        if piece == TIGER_CHAR:
            tigers.append(pos_num)
        else:
            goats.append(pos_num)
    return tuple(tigers), tuple(goats)


class TigerAndGoat(TwoPlayersGame):
    history_max_len = 20

    def __init__(self, players):
        self.players = players
        self.pieces = {}
        self.goats_to_place = NUM_GOATS
        # goat always starts
        self.nplayer = GOAT_PLAYER
        self.place_tigers()
        # check for repetition against the most recent states.
        # just far back enough to prevent endless loops.
        # AI lookahead will append and then pop (upon unmove), so this must be sized as
        # "enough history" + AI lookahead depth
        self.history = deque([split_nodes(self.pieces)], maxlen=self.history_max_len)

    def ttentry(self):
        """Game state consists of:
        - current player name
        - number of goats left to place
        - possibly truncated piece position history, always at least 1 turn back
            - while still placing goats just keep 1 turn, as move loops won't last
        """
        history = [self.history[-1]] if self.goats_to_place else self.history
        return (self.player.name, self.goats_to_place, tuple(history))

    def ttrestore(self, entry):
        player_name, self.goats_to_place, history = entry

        self.nplayer = 1 if player_name == self.players[0].name else 2
        tigers, goats = history[-1]

        self.pieces = {
            **dict.fromkeys(tigers, TIGER_CHAR),
            **dict.fromkeys(goats, GOAT_CHAR),
        }

        self.history = deque(history, maxlen=self.history_max_len)

    def place_tigers(self):
        # corner positions
        self.pieces.update(dict.fromkeys([0, 4, 20, 24], TIGER_CHAR))

    def pretty_move(self, pos_nums):
        return pos_num_to_notation(pos_nums)

    def parse_move(self, move):
        try:
            return notation_to_pos_num(move)
        except ValueError:
            raise

    def make_move(self, coords):
        self.pieces = apply_move(coords, self.pieces)
        if len(coords) == 1:
            self.goats_to_place -= 1
        self.history.append(split_nodes(self.pieces))

    def unmake_move(self, coords):
        self.pieces = unapply_move(coords, self.pieces)
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

    def tiger_nodes(self):
        return [pos for pos, piece in self.pieces.items() if piece == TIGER_CHAR]

    def goat_nodes(self):
        return [pos for pos, piece in self.pieces.items() if piece == GOAT_CHAR]

    def seen(self, coords):
        if self.goats_to_place:
            return False
        new_pieces = apply_move(coords, self.pieces)
        return split_nodes(new_pieces) in self.history

    def get_steps(self, nodes):
        for node in nodes:
            for dest in STEPS_GRAPH[node]:
                if dest not in self.pieces:
                    coords = node, dest
                    if not self.seen(coords):
                        yield coords

    def tiger_steps(self):
        yield from self.get_steps(self.tiger_nodes())

    def tiger_jumps(self):
        for tiger in self.tiger_nodes():
            for dest in JUMPS_GRAPH[tiger]:
                # jumps from src to dest consist of pos nums deltas:
                # - eat +1 landing on +2 (horizontal)
                # - eat +5 landing on +10 (vertical)
                # - eat +6 landing on +12 (diag: \)
                # - eat +4 landing on +8 (diag: /)
                # - (and the reverse of each)
                # in all cases the eaten is the average of of src & dest pos nums
                eaten = (tiger + dest) // 2
                if self.pieces.get(eaten) == GOAT_CHAR and dest not in self.pieces:
                    coords = tiger, eaten, dest
                    yield coords

    def mobile_tigers(self):
        # pass short_circuit = True
        return len({mv[0] for mv in self.tiger_moves()})

    def goat_placements(self):
        # first goat placed only need consider unique positions
        if len(self.pieces) == 4:
            positions = self.unique_positions() - set(self.pieces)
        else:
            positions = self.empty()
        return [(pos,) for pos in positions]

    def goat_steps(self):
        yield from self.get_steps(self.goat_nodes())

    def tiger_moves(self):
        yield from self.tiger_jumps()
        yield from self.tiger_steps()

    def goat_moves(self):
        if self.goats_to_place:
            yield from self.goat_placements()
        else:
            yield from self.goat_steps()

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
        return self.tigers_go() and not list(self.tiger_moves())

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
        print(self.ttentry())

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
    history = game.play(500)
    print('duration', f'{time.monotonic() - start:.0f} seconds')
