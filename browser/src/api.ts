import { ApiResponse, create } from 'apisauce';
import { fromJS, List } from 'immutable';
import { StateOfGameType, UpdatedGameType } from './State';

const api = create({
  baseURL: 'http://localhost:8000',
});

const checkResponse = (value: ApiResponse<UpdatedGameType>) => {
  const { ok, data, problem, status } = value;

  if (ok) {
    return <UpdatedGameType>fromJS(data).toObject();
  }
  throw Error(`${status} ${problem}`);
};

export const getData: () => Promise<UpdatedGameType> = () => {
  return api.get<UpdatedGameType>('/start').then(checkResponse);
};
export const postData: (
  stateOfGame: StateOfGameType,
  move: List<number> | null,
) => Promise<UpdatedGameType> = (stateOfGame, move) => {
  return api.post<UpdatedGameType>('/move', { move, stateOfGame }).then(checkResponse);
};
