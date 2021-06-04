import { create, ApiResponse } from 'apisauce';

const api = create({
  baseURL: 'http://localhost:8000',
});

export type GameType = {
  playerNum: number;
  goatsToPlace: number;
  history: number[][];
  tigers: number[];
  goats: number[];
};

// https://github.com/infinitered/apisauce/issues/197
// : (res: ApiResponse<GameType>) => GameType
const checkResponse = (res: ApiResponse<any>) => {
  const { ok, data } = res;

  if (ok) {
    return <GameType>data;
  }
  throw Error;
};

export const getData: () => Promise<any> = () => {
  return api.get('/hello').then(checkResponse).catch(console.error);
};
