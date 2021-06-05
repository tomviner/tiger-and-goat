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

const checkResponse = (value: ApiResponse<GameType>) => {
  const { ok, data, problem, status } = value;

  if (ok) {
    return <GameType>fromJS(data).toObject();
  }
  throw Error(`${status} ${problem}`);
};

export const getData: () => Promise<GameType> = () => {
  return api.get<GameType>('/hello').then(checkResponse);
};
