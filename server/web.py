import random
from typing import Annotated, Literal

from easyAI import Negamax
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .constants import GOAT_PLAYER
from .game import TigerAndGoat
from .strategies import GOAT_STRATEGIES, TIGER_STRATEGIES

MIN_DEPTH = 1
MAX_DEPTH = 8
DEFAULT_DEPTH = 6

STRATEGY_REGISTRY = {s.name: s for s in (*GOAT_STRATEGIES, *TIGER_STRATEGIES)}


def side_name(side: int) -> str:
    return "goat" if side == GOAT_PLAYER else "tiger"


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


class Controller(BaseModel):
    """Who controls one side: the human, the search AI, or a named strategy."""

    type: Literal["human", "ai", "strategy"] = "human"
    depth: int = Field(default=DEFAULT_DEPTH, ge=MIN_DEPTH, le=MAX_DEPTH)
    name: str | None = None


class Controllers(BaseModel):
    goat: Controller = Field(default_factory=lambda: Controller(type="human"))
    tiger: Controller = Field(default_factory=lambda: Controller(type="ai"))


class MoveRequest(BaseModel):
    state_of_game: GameState = Field(alias="stateOfGame")
    move: list[int] | None = None
    controllers: Controllers = Field(default_factory=Controllers)


def build_game(state_of_game: GameState | None = None) -> TigerAndGoat:
    game = TigerAndGoat([None, None])
    if state_of_game:
        game.ttrestore(
            (
                state_of_game.player_num,
                state_of_game.num_goats_to_place,
                state_of_game.history,
            )
        )
    return game


def engine_move(game: TigerAndGoat, controller: Controller):
    """Pick the move for the side to move, using its engine controller.

    A named strategy is used only when it matches the side to move; otherwise
    we fall back to the search AI so a legal move is always produced.
    """
    if controller.type == "strategy":
        strategy = STRATEGY_REGISTRY.get(controller.name)
        if strategy is None:
            raise HTTPException(status_code=400, detail="Unknown strategy")
        if strategy.side == game.current_player:
            return strategy.choose(game, random.Random())
    return Negamax(controller.depth)(game)


def controller_for(controllers: Controllers, side: int) -> Controller:
    return controllers.goat if side == GOAT_PLAYER else controllers.tiger


app = FastAPI(title="Tigers and Goats", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/start")
def start() -> dict:
    return build_game().as_dict()


@app.get("/opponents")
def opponents() -> dict:
    return {
        "strategies": [
            {
                "name": s.name,
                "side": s.side,
                "sideName": side_name(s.side),
                "description": s.description,
            }
            for s in (*GOAT_STRATEGIES, *TIGER_STRATEGIES)
        ],
        "depth": {"min": MIN_DEPTH, "max": MAX_DEPTH, "default": DEFAULT_DEPTH},
    }


@app.post("/move")
def move(payload: Annotated[MoveRequest, Body()]) -> dict:
    game = build_game(payload.state_of_game)

    if payload.move is not None:
        client_move = tuple(payload.move)
        if client_move not in game.possible_moves():
            raise HTTPException(status_code=400, detail="Illegal move")
        game.play_move(client_move)

    # If the side now to move is engine-controlled, play its one reply. (The
    # client drives any further engine moves by polling with move=None, so each
    # response carries a single move to animate.)
    remote_move = None
    if not game.is_over():
        controller = controller_for(payload.controllers, game.current_player)
        if controller.type != "human":
            remote_move = engine_move(game, controller)
            game.play_move(remote_move)

    return {"remoteMove": remote_move, **game.as_dict()}
