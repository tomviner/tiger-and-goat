import { ApiResponse, create } from 'apisauce';

const api = create({
  baseURL: 'http://localhost:8000',
});

export type GameType = {
  playerNum: number;
  numGoatsToPlace: number;
  history: number[][];
  possibleMoves: number[][];
  tigers: number[];
  goats: number[];
};

const checkResponse = (value: ApiResponse<GameType>) => {
  const { ok, data, problem, status } = value;

  if (ok) {
    return <GameType>data;
  }
  throw Error(`${status} ${problem}`);
};

export const getData: () => Promise<GameType> = () => {
  return api.get<GameType>('/hello').then(checkResponse);
};
