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


def display(pieces):
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
    print(''.join(board))
