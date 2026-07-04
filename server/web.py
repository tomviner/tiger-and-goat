from typing import Annotated

from easyAI import AI_Player, Human_Player, Negamax
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .game import TigerAndGoat


class GameState(BaseModel):
    player_num: int = Field(alias="playerNum", ge=1, le=2)
    num_goats_to_place: int = Field(alias="numGoatsToPlace", ge=0, le=20)
    history: list[list[list[int]]] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_position(self):
        for position in self.history:
            if len(position) != 2:
                raise ValueError("Each position must contain tigers and goats")
            tigers, goats = position
            occupied = tigers + goats
            if len(tigers) != 4:
                raise ValueError("Each position must contain four tigers")
            if len(occupied) != len(set(occupied)):
                raise ValueError("A square cannot contain multiple pieces")
            if any(square not in range(25) for square in occupied):
                raise ValueError("Piece positions must be between 0 and 24")

        _, goats = self.history[-1]
        goats_eaten = 20 - self.num_goats_to_place - len(goats)
        if goats_eaten not in range(6):
            raise ValueError("The goat count is inconsistent with the board")
        return self


class MoveRequest(BaseModel):
    state_of_game: GameState = Field(alias="stateOfGame")
    move: list[int] | None = None


def get_game(
    state_of_game: GameState | None = None, *, have_client_move: bool = True
) -> TigerAndGoat:
    player_num = state_of_game.player_num if state_of_game else 1
    tiger_plays = player_num == 2
    ai_is_goat = tiger_plays == have_client_move
    ai_player = Negamax(6)

    if ai_is_goat:
        players = [AI_Player(ai_player, "goat"), Human_Player("tiger")]
    else:
        players = [Human_Player("goat"), AI_Player(ai_player, "tiger")]

    game = TigerAndGoat(players)
    if state_of_game:
        game.ttrestore(
            (
                state_of_game.player_num,
                state_of_game.num_goats_to_place,
                state_of_game.history,
            )
        )
    return game


app = FastAPI(title="Tigers and Goats", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/start")
def start() -> dict:
    return get_game().as_dict()


@app.post("/move")
def move(payload: Annotated[MoveRequest, Body()]) -> dict:
    game = get_game(payload.state_of_game, have_client_move=payload.move is not None)

    if payload.move is not None:
        client_move = tuple(payload.move)
        if client_move not in game.possible_moves():
            raise HTTPException(status_code=400, detail="Illegal move")
        game.play_move(client_move)

    ai_move = None
    if not game.is_over():
        ai_move = game.get_move()
        game.play_move(ai_move)

    return {"remoteMove": ai_move, **game.as_dict()}
