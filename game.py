from graph import get_nodes
from board import display
from constants import TIGER

from itertools import product


nodes = get_nodes()


display(dict.fromkeys(product(range(0, 5, 4), repeat=2), TIGER))
