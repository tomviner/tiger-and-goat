from constants import GOAT_CHAR


BOARD = (
    '  ─  ─  ─  ─  \n'
    ' │╲ │╱ │╲ │╱ │\n'
    '  ─  ─  ─  ─  \n'
    ' │╱ │╲ │╱ │╲ │\n'
    '  ─  ─  ─  ─  \n'
    ' │╲ │╱ │╲ │╱ │\n'
    '  ─  ─  ─  ─  \n'
    ' │╱ │╲ │╱ │╲ │\n'
    '  ─  ─  ─  ─  \n'
)


def display(pieces, goats_to_place, goats_eaten):
    board = list(BOARD)
    dels = []
    for (x, y), piece in pieces.items():
        n = 1 + (30 * y) + (3 * x)
        board[n] = piece
        # emoji take up 2 spaces in my terminal
        dels.append(n - 1)
    # remove from end, so indexes still make sense
    for n in sorted(dels, reverse=True):
        del board[n]
    print(GOAT_CHAR * goats_to_place)
    print(''.join(board))
    print(GOAT_CHAR * goats_eaten)
