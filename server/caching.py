from decopatch import F_ARGS, F_KWARGS, WRAPPED, function_decorator


GLOBAL_CACHE = {}
CACHE_DATA = {
    'hits': 0,
    'miss': 0,
}


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
        # CACHE_DATA['hits'] += 1
    except KeyError:
        value = func(*func_args, **func_kwargs)
        _cache[key] = value
        # print('MISS', end=' ')
        # CACHE_DATA['miss'] += 1

    # print(key)
    # print(value)
    # import random
    # if not random.randint(0, 5000):
    #     hit_rate = CACHE_DATA['hits'] / (CACHE_DATA['hits'] + CACHE_DATA['miss'])
    #     print(f"{CACHE_DATA['hits']} Hits ({hit_rate:.0%}), {CACHE_DATA['miss']} Misses, {len(GLOBAL_CACHE)} Mem")
    return value


def clear_cache(_cache=GLOBAL_CACHE):
    _cache.clear()
