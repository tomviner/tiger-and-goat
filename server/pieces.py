from collections.abc import MutableMapping

from constants import GOAT_CHAR, TIGER_CHAR


class Pieces(MutableMapping):
    def __init__(self, tigers=(), goats=()):
        self.tigers = set(tigers)
        self.goats = set(goats)
        self.inverse = {TIGER_CHAR: self.tigers, GOAT_CHAR: self.goats}

    @property
    def canonical(self):
        return frozenset(self.tigers), frozenset(self.goats)

    def copy(self):
        return self.__class__(self.tigers.copy(), self.goats.copy())

    def __len__(self):
        return len(self.tigers) + len(self.goats)

    def __getitem__(self, item):
        if item in self.goats:
            return GOAT_CHAR
        if item in self.tigers:
            return TIGER_CHAR
        raise KeyError

    def __setitem__(self, key, value):
        self.inverse[value].add(key)

    def __delitem__(self, item):
        try:
            self.tigers.remove(item)
        except KeyError:
            self.goats.remove(item)

    def __iter__(self):
        yield from self.tigers
        yield from self.goats
