import pytest

from server.graph import JUMPS_GRAPH, STEPS_GRAPH
from server.notations import coord_to_pos_num


def pairwise(values):
    return zip(values, values[1:], strict=False)


def triplewise(values):
    return zip(values, values[1:], values[2:], strict=False)


@pytest.fixture
def graphs():
    graphs = {"steps": {}, "jumps": {}}

    def link(graph, coord_1, coord_2):
        pos_num_1 = coord_to_pos_num(coord_1)
        pos_num_2 = coord_to_pos_num(coord_2)
        graph.setdefault(pos_num_1, []).append(pos_num_2)
        graph.setdefault(pos_num_2, []).append(pos_num_1)

    for y in range(5):
        for x1, x2 in pairwise(list(range(5))):
            link(graphs["steps"], (x1, y), (x2, y))
        for x1, _, x3 in triplewise(list(range(5))):
            link(graphs["jumps"], (x1, y), (x3, y))

    for x in range(5):
        for y1, y2 in pairwise(list(range(5))):
            link(graphs["steps"], (x, y1), (x, y2))
        for y1, _, y3 in triplewise(list(range(5))):
            link(graphs["jumps"], (x, y1), (x, y3))

    diagonal_lines = [
        [(i, i) for i in range(5)],
        [(i, 4 - i) for i in range(5)],
        [(i + 2, i) for i in range(3)],
        [(i, i + 2) for i in range(3)],
        [(i, 2 - i) for i in range(3)],
        [(i + 2, 4 - i) for i in range(3)],
    ]
    for line in diagonal_lines:
        for coord_1, coord_2 in pairwise(line):
            link(graphs["steps"], coord_1, coord_2)
        for coord_1, _, coord_3 in triplewise(line):
            link(graphs["jumps"], coord_1, coord_3)

    return graphs


def test_graphs(graphs):
    assert graphs == {"steps": STEPS_GRAPH, "jumps": JUMPS_GRAPH}
