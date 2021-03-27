from constants import GOAT_CHAR


BOARD = (
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


def display(pieces, goats_to_place, goats_eaten):
    board = list(BOARD)
    dels = []
    for (x, y), piece in pieces.items():
        n = 2 + (32 * y) + (3 * x)
        board[n] = piece
        # emoji take up 2 spaces in my terminal
        dels.append(n - 1)
    # remove from end, so indexes still make sense
    for n in sorted(dels, reverse=True):
        del board[n]
    print(GOAT_CHAR * goats_to_place)
    print(' A  B  C  D  E')
    print(''.join(board))
    print(GOAT_CHAR * goats_eaten)
