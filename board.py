from constants import GOAT_CHAR
from notations import pos_num_to_coord


BOARD = (
    ' A  B  C  D  E \n'
    '1  ─  ─  ─  ─  \n'
    '  │╲ │╱ │╲ │╱ │\n'
    '2  ─  ─  ─  ─  \n'
    '  │╱ │╲ │╱ │╲ │\n'
    '3  ─  ─  ─  ─  \n'
    '  │╲ │╱ │╲ │╱ │\n'
    '4  ─  ─  ─  ─  \n'
    '  │╱ │╲ │╱ │╲ │\n'
    '5  ─  ─  ─  ─  \n'
)


def display(pieces, goats_to_place=0, goats_eaten=0):
    board = list(BOARD)
    dels = []
    for pos_num, piece in pieces.items():
        x, y = pos_num_to_coord(pos_num)
        n = 18 + (32 * y) + (3 * x)
        board[n] = piece
        # emoji take up 2 spaces in my terminal
        dels.append(n - 1)
    # remove from end of string, so indexes still make sense
    for n in sorted(dels, reverse=True):
        del board[n]
    print(GOAT_CHAR * goats_to_place)
    print(''.join(board))
    print(GOAT_CHAR * goats_eaten)
