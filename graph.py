from funcy import pairwise, partition

from notations import coord_to_pos_num


def triplewise(seq):
    return partition(3, 1, seq)


def get_graphs():
    graphs = {
        'steps': {},
        'jumps': {},
    }

    def link(graph, a, b):
        pos_num_1 = coord_to_pos_num(a)
        pos_num_2 = coord_to_pos_num(b)

        graph.setdefault(pos_num_1, [])
        graph[pos_num_1].append(pos_num_2)

        graph.setdefault(pos_num_2, [])
        graph[pos_num_2].append(pos_num_1)

    def link_step_nodes(a, b):
        link(graphs['steps'], a, b)

    def link_jump_nodes(a, b, c):
        link(graphs['jumps'], a, c)

    # horizontal lines
    for y in range(5):
        for x1, x2 in pairwise(range(5)):
            link_step_nodes((x1, y), (x2, y))
        for x1, x2, x3 in triplewise(range(5)):
            link_jump_nodes((x1, y), (x2, y), (x3, y))

    # vertical lines
    for x in range(5):
        for y1, y2 in pairwise(range(5)):
            link_step_nodes((x, y1), (x, y2))
        for y1, y2, y3 in triplewise(range(5)):
            link_jump_nodes((x, y1), (x, y2), (x, y3))

    # corner to corner diagonal line: \
    for i1, i2 in pairwise(range(5)):
        link_step_nodes((i1, i1), (i2, i2))
    for i1, i2, i3 in triplewise(range(5)):
        link_jump_nodes((i1, i1), (i2, i2), (i3, i3))

    # corner to corner diagonal line: /
    for i1, i2 in pairwise(range(5)):
        link_step_nodes((i1, 4 - i1), (i2, 4 - i2))
    for i1, i2, i3 in triplewise(range(5)):
        link_jump_nodes((i1, 4 - i1), (i2, 4 - i2), (i3, 4 - i3))

    # bottom left: \
    for i1, i2 in pairwise(range(3)):
        link_step_nodes((i1 + 2, i1), (i2 + 2, i2))
    for i1, i2, i3 in triplewise(range(3)):
        link_jump_nodes((i1 + 2, i1), (i2 + 2, i2), (i3 + 2, i3))

    # top right: \
    for i1, i2 in pairwise(range(3)):
        link_step_nodes((i1, i1 + 2), (i2, i2 + 2))
    for i1, i2, i3 in triplewise(range(3)):
        link_jump_nodes((i1, i1 + 2), (i2, i2 + 2), (i3, i3 + 2))

    # top left: /
    for i1, i2 in pairwise(range(3)):
        link_step_nodes((i1, 2 - i1), (i2, 2 - i2))
    for i1, i2, i3 in triplewise(range(3)):
        link_jump_nodes((i1, 2 - i1), (i2, 2 - i2), (i3, 2 - i3))

    # bottom right: /
    for i1, i2 in pairwise(range(3)):
        link_step_nodes((i1 + 2, 4 - i1), (i2 + 2, 4 - i2))
    for i1, i2, i3 in triplewise(range(3)):
        link_jump_nodes((i1 + 2, 4 - i1), (i2 + 2, 4 - i2), (i3 + 2, 4 - i3))

    return graphs
