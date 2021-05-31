import json

import hug
from easyAI import AI_Player, Human_Player, Negamax
from easyAI.AI import TT
from hug.middleware import SessionMiddleware
from hug.store import InMemoryStore

from game import TigerAndGoat


def get_game(request, session):
    kw1, kw2 = {}, {}
    if 0:
        kw1 = {'tt': TT()}
        kw2 = {'tt': TT()}
    goat_ai = Negamax(6, **kw1)
    tiger_ai = Negamax(6, **kw2)
    game = TigerAndGoat([Human_Player('goat'), AI_Player(tiger_ai, 'tiger')])

    req_game = request.cookies.get('game')
    sess_game = session.get('game')

    print(f'{request.cookies=} {req_game=} {sess_game=}')

    data = None
    if req_game:
        data = json.loads((req_game.encode()))
    # elif sess_game:
    #     data = sess_game

    if data:
        game.ttrestore(data)

    return game


session_store = InMemoryStore()
middleware = SessionMiddleware(session_store, cookie_secure=False)

api = hug.API(__name__)
api.http.add_middleware(middleware)
api.http.add_middleware(hug.middleware.CORSMiddleware(api))


@hug.get()
@hug.cli()
def hello(session: hug.directives.session, request):
    game = get_game(request, session)

    return game.as_dict()


@hug.post()
@hug.cli()
def hello(move: list[int], session: hug.directives.session, request, response):
    game = get_game(request, session)

    game.play_move(move)
    if not game.is_over():
        ai_move = game.get_move()
        game.play_move(ai_move)

    data = game.ttentry(json_safe=True)
    print(f'{data=} {json.dumps(data)=}')
    session['game'] = data
    cookie = (json.dumps(data).encode()).decode()
    print(f'{cookie=}')
    response.set_cookie('game', cookie, secure=False)
    return data


@hug.delete()
@hug.cli()
def hello(session: hug.directives.session):
    try:
        del session['game']
    except KeyError:
        pass


if __name__ == '__main__':
    hello.interface.cli()
