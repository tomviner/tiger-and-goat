import networkx as nx
import pylab as plt
from funcy import pairwise, partition


def triplewise(seq):
    return partition(3, 1, seq)


class Node:
    def __init__(self, x, y, graph):
        self.x = x
        self.y = y
        self.pos = x, y

        self.step_links = []
        self.jump_links = []

        graph.add_node(self)
        self.graph = graph

    def link_step(self, other):
        self.step_links.append(other)
        other.step_links.append(self)
        self.graph.add_edge(self, other)
        self.graph.add_edge(other, self)

    def link_jump(self, eaten, other):
        self.jump_links.append((eaten, other))
        other.jump_links.append((eaten, self))
        self.graph.add_edge(self, other)

    def __repr__(self):
        return f"N({self.x}, {self.y})"


def get_nodes():
    graph = nx.MultiGraph()

    nodes = {(x, y): Node(x, y, graph) for x in range(5) for y in range(5)}

    def link_step_nodes(a, b):
        n1 = nodes[a]
        n2 = nodes[b]
        n1.link_step(n2)

    def link_jump_nodes(a, b, c):
        n1 = nodes[a]
        n2 = nodes[b]
        n3 = nodes[c]
        n1.link_jump(n2, n3)

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

    display_graph(graph)

    return nodes


def display_graph(graph):
    plt.figure(figsize=(15, 10))

    nx.draw(
        graph,
        with_labels=True,
        node_color='white',
        pos=nx.nx_agraph.graphviz_layout(graph),
    )
