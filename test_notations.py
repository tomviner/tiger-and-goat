import pytest

from notations import (
    coord_to_pos_num,
    coords_to_notation,
    coords_to_pos_num,
    notation_to_coords,
    notation_to_pos_num,
    pos_num_to_coord,
    pos_num_to_notation,
    pos_nums_to_coords,
)


@pytest.mark.parametrize(
    'notation, coords, pos_nums',
    [
        ('D1', ((3, 0),), (3,)),
        ('A1-B1', ((0, 0), (1, 0)), (0, 1)),
        ('C3-D4-E5', ((2, 2), (3, 3), (4, 4)), (12, 18, 24)),
    ],
)
def test_conversions(notation, coords, pos_nums):
    assert notation_to_coords(notation) == coords
    assert coords_to_notation(coords) == notation

    assert pos_nums_to_coords(pos_nums) == coords
    assert coords_to_pos_num(coords) == pos_nums

    assert notation_to_pos_num(notation) == pos_nums
    assert pos_num_to_notation(pos_nums) == notation


@pytest.mark.parametrize(
    'notation, coord, pos_num',
    [
        ('D1', (3, 0), 3),
    ],
)
def test_coord_and_pos_num(notation, coord, pos_num):
    assert coord_to_pos_num(coord) == pos_num
    assert pos_num_to_coord(pos_num) == coord
