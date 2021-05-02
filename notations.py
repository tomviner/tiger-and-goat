r"""Converters for our notation systems.

- coords: (0, 0) to (4, 4), with origin top left
- pos_num: internal system, with positions (0-24 inc) enumerated below
- notation: human readable labels (A1-E5) for columns (letter) and rows (number)

  A  B  C  D  E
1  0─ 1─ 2─ 3─ 4
   │╲ │╱ │╲ │╱ │
2  5─ 6─ 7─ 8─ 9
   │╱ │╲ │╱ │╲ │
3 10─11─12─13─14
   │╲ │╱ │╲ │╱ │
4 15─16─17─18─19
   │╱ │╲ │╱ │╲ │
5 20─21─22─23─24

Note about pos nums, jumps from src to dest consist of pos nums deltas:
- eat +1 landing on +2 (horizontal)
- eat +5 landing on +10 (vertical)
- eat +6 landing on +12 (diag: \)
- eat +4 landing on +8 (diag: /)
- (and the reverse of each)
in all cases the eaten is the average of of src & dest pos nums
"""
import re

from funcy import joining, post_processing


ALL_POS_NUMS = set(range(25))


@post_processing(tuple)
def notation_to_coords(notation):
    """
    Placement: A1
    Step: A1-A2
    Jump: A1-A2-A3
    """
    for notation in re.split(r'[- ]+', notation):
        col, row = notation
        yield 'ABCDE'.index(col.upper()), int(row) - 1


@joining('-')
def coords_to_notation(coords):
    for x, y in coords:
        col = 'ABCDE'[x]
        row = y + 1
        yield f'{col}{row}'


def coord_to_pos_num(coord):
    x, y = coord
    return 5 * y + x


def pos_num_to_coord(pos_num):
    y, x = divmod(pos_num, 5)
    return x, y


@post_processing(tuple)
def pos_nums_to_coords(pos_nums):
    for pos_num in pos_nums:
        yield pos_num_to_coord(pos_num)


@post_processing(tuple)
def coords_to_pos_num(coords):
    for coord in coords:
        yield coord_to_pos_num(coord)


def pos_num_to_notation(pos_num):
    return coords_to_notation(pos_nums_to_coords(pos_num))


def notation_to_pos_num(notation):
    return coords_to_pos_num(notation_to_coords(notation))
