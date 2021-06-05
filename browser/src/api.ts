import { ApiResponse, create } from 'apisauce';
import { fromJS, List } from 'immutable';

const api = create({
  baseURL: 'http://localhost:8000',
});

export type GameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: List<List<number>>;
  possibleMoves: List<List<number>>;
  tigers: List<number>;
  goats: List<number>;
};

const cache = { game: [0, 0, [[0]]] };

const checkResponse = (value: ApiResponse<GameType>) => {
  const { ok, data, problem, status, headers } = value;

  if (ok) {
    const d = <GameType>fromJS(data).toObject();
    const { playerNum, numGoatsToPlace, history } = d;
    cache.game = [playerNum, numGoatsToPlace, history.toJS()];
    return d;
  }
  throw Error(`${status} ${problem}`);
};

export const getData: () => Promise<GameType> = () => {
  return api.get<GameType>('/hello').then(checkResponse);
};
// , game: string
export const postData: (move: List<number>) => Promise<GameType> = (move) => {
  return api.post<GameType>('/hello', { move, state: cache.game }).then(checkResponse);
};
