from funcy import pairwise
import networkx as nx
import pylab as plt


class Node:
    def __init__(self, x, y, graph):
        self.x = x
        self.y = y

        self.links = []

        graph.add_node(self)
        self.graph = graph

    def link(self, other):
        self.links.append(other)
        other.links.append(self)
        self.graph.add_edge(self, other)
        self.graph.add_edge(other, self)

    def __repr__(self):
        return f'{self.x}, {self.y}'


def get_nodes():
    graph = nx.MultiGraph()

    nodes = {(x, y): Node(x, y, graph) for x in range(5) for y in range(5)}

    def link_nodes(a, b):
        n1 = nodes[a]
        n2 = nodes[b]
        n1.link(n2)

    for y in range(5):
        for x1, x2 in pairwise(range(5)):
            link_nodes((x1, y), (x2, y))

    for x in range(5):
        for y1, y2 in pairwise(range(5)):
            link_nodes((x, y1), (x, y2))

    for i1, i2 in pairwise(range(5)):
        link_nodes((i1, i1), (i2, i2))

    for i1, i2 in pairwise(range(5)):
        link_nodes((i1, 4 - i1), (i2, 4 - i2))

    for i1, i2 in pairwise(range(3)):
        link_nodes((i1 + 2, i1), (i2 + 2, i2))

    for i1, i2 in pairwise(range(3)):
        link_nodes((i1, i1 + 2), (i2, i2 + 2))

    for i1, i2 in pairwise(range(3)):
        link_nodes((i1, 2 - i1), (i2, 2 - i2))

    for i1, i2 in pairwise(range(3)):
        link_nodes((i1 + 2, 4 - i1), (i2 + 2, 4 - i2))

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
