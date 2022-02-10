# from colr import color

write_methods = '''
- switch_player
- make_move
- unmake_move
- current_player
'''

read_methods = '''
- possible_moves
- is_over
- scoring
'''

def log(f):
    def _f(*a, **kw):
        name = f.__name__
        if name in write_methods:
            col = 'red'
        elif name in read_methods:
            col = 'green'
        else:
            col = 'yellow'
        # print(color(name, fore=col), end=' ')
        x = f(*a, **kw)
        # if a and 'object' in str(a[0]):
        #     a = a[1:]
        # if a:
        #     print(str(a)[1:-2], end=' ')
        # if kw:
        #     print(kw, end=' ')
        # print()
        # if isinstance(x, int) or x is not None:
        #     print('\t', x)
        return x

    return _f
