from fastapi.testclient import TestClient

from server.web import app

client = TestClient(app)


def test_start_returns_initial_game():
    response = client.get("/start")
    assert response.status_code == 200
    data = response.json()
    assert data["playerNum"] == 1
    assert data["numGoatsToPlace"] == 20
    assert len(data["possibleMoves"]) == 21
    assert data["result"] == ""


def test_move_rejects_illegal_client_move():
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={"stateOfGame": state, "move": [0]},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Illegal move"}


def test_move_rejects_impossible_board_state():
    response = client.post(
        "/move",
        json={
            "stateOfGame": {
                "playerNum": 1,
                "numGoatsToPlace": 20,
                "history": [[[0, 4, 20, 24], [0]]],
            },
            "move": [1],
        },
    )
    assert response.status_code == 422


def test_opponents_lists_strategies_and_depth():
    data = client.get("/opponents").json()
    names = {s["name"] for s in data["strategies"]}
    assert "tiger-centre-control" in names
    assert "goat-safe-edge" in names
    assert {s["sideName"] for s in data["strategies"]} == {"goat", "tiger"}
    assert data["depth"] == {"min": 1, "max": 8, "default": 6}


def test_move_against_named_strategy():
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": [12],
            "controllers": {
                "goat": {"type": "human"},
                "tiger": {"type": "strategy", "name": "tiger-centre-control"},
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["remoteMove"] is not None  # the tiger strategy replied


def test_move_against_ai_with_depth():
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": [12],
            "controllers": {
                "goat": {"type": "human"},
                "tiger": {"type": "ai", "depth": 2},
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["remoteMove"] is not None


def test_human_controlled_side_gets_no_engine_reply():
    """With both sides human (hotseat), the server plays no reply."""
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": [12],
            "controllers": {"goat": {"type": "human"}, "tiger": {"type": "human"}},
        },
    )
    assert response.status_code == 200
    assert response.json()["remoteMove"] is None


def test_poll_advances_engine_side_with_no_client_move():
    """An engine side to move replies even when the client sends no move."""
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": None,
            "controllers": {
                "goat": {"type": "strategy", "name": "goat-safe-edge"},
                "tiger": {"type": "ai", "depth": 2},
            },
        },
    )
    assert response.status_code == 200
    # goat is to move first and is engine-controlled, so it places a goat
    assert response.json()["remoteMove"] is not None


def test_move_rejects_unknown_strategy():
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": [12],
            "controllers": {
                "goat": {"type": "human"},
                "tiger": {"type": "strategy", "name": "nope"},
            },
        },
    )
    assert response.status_code == 400


def test_move_rejects_out_of_range_depth():
    state = client.get("/start").json()
    response = client.post(
        "/move",
        json={
            "stateOfGame": state,
            "move": [12],
            "controllers": {
                "goat": {"type": "human"},
                "tiger": {"type": "ai", "depth": 99},
            },
        },
    )
    assert response.status_code == 422
