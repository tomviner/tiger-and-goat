import { ApiResponse, create } from 'apisauce';
import { fromJS, List } from 'immutable';

const api = create({
  baseURL: 'http://localhost:8000',
});

export type UpdatedGameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: List<List<List<number>>>;
  possibleMoves: List<List<number>>;
  tigers: List<number>;
  goats: List<number>;
};

export type PriorGameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: List<List<List<number>>>;
};

const checkResponse = (value: ApiResponse<UpdatedGameType>) => {
  const { ok, data, problem, status } = value;

  if (ok) {
    return <UpdatedGameType>fromJS(data).toObject();
  }
  throw Error(`${status} ${problem}`);
};

export const getData: () => Promise<UpdatedGameType> = () => {
  return api.get<UpdatedGameType>('/hello').then(checkResponse);
};
export const postData: (
  move: List<number>,
  priorGame: PriorGameType,
) => Promise<UpdatedGameType> = (move, priorGame) => {
  return api.post<UpdatedGameType>('/hello', { move, priorGame }).then(checkResponse);
};
