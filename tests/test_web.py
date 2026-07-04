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
