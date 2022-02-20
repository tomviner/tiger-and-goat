import hug
from easyAI import AI_Player, Human_Player, Negamax

from game import TigerAndGoat


def get_game(state_of_game={}, have_client_move=True):
    player_num = state_of_game.get('playerNum', 1)

    # player_num | have_client_move | ai_is_goat
    #          1 |            false | true
    #          1 |             true | false
    #          2 |            false | false
    #          2 |             true | true

    tiger_plays = player_num == 2
    ai_is_goat = tiger_plays == have_client_move

    ai_player = Negamax(6 if ai_is_goat else 6)
    if ai_is_goat:
        game = TigerAndGoat([AI_Player(ai_player, 'goat'), Human_Player('tiger')])
    else:
        game = TigerAndGoat([Human_Player('goat'), AI_Player(ai_player, 'tiger')])

    if state_of_game:
        data = [
            player_num,
            state_of_game['numGoatsToPlace'],
            state_of_game['history'],
        ]
        game.ttrestore(data)

    return game


api = hug.API(__name__)
api.http.add_middleware(hug.middleware.CORSMiddleware(api))


@hug.get()
def start():
    game = get_game()
    return game.as_dict()


@hug.post()
def move(stateOfGame, move=None):
    have_client_move = bool(move)

    game = get_game(stateOfGame, have_client_move)

    if have_client_move:
        game.play_move(move)

    ai_move = None
    if not game.is_over():
        ai_move = game.get_move()
        # print('xxx alpha', game.players[1].AI_algo.alpha, ai_move)
        game.play_move(ai_move)

    return {'remoteMove': ai_move, **game.as_dict()}


if __name__ == '__main__':
    start.interface.cli()
