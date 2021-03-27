from decopatch import F_ARGS, F_KWARGS, WRAPPED, function_decorator


GLOBAL_CACHE = {}


@function_decorator
def cache(
    func=WRAPPED,
    func_args=F_ARGS,
    func_kwargs=F_KWARGS,
    _cache=GLOBAL_CACHE,
):
    """
    Cache decorator.

    Usage:
        - @cache
        - @cache()

    Note: this is implemented with decopatch.function_decorator which allows writing
    the replacement function in one single pass.
    """
    key = f'{func.__name__}:{func_args!r}:{func_kwargs!r}'

    try:
        value = _cache[key]
        # print('HIT', end=' ')
    except KeyError:
        value = func(*func_args, **func_kwargs)
        _cache[key] = value
        # print('MISS', end=' ')

    # print(key)
    # print(value)
    return value


def clear_cache(_cache=GLOBAL_CACHE):
    _cache.clear()
