import { ApiResponse, create } from 'apisauce';
import { Collection, fromJS, isKeyed, List } from 'immutable';
import { StateOfGameType, UpdatedGameType } from './State';

const api = create({
  baseURL: 'http://localhost:8000',
});

const checkResponse = (value: ApiResponse<UpdatedGameType>) => {
  const { ok, data, problem, status } = value;

  const isSetPath = (path: (string | number)[]) =>
    // playerNum: number;
    // numGoatsToPlace: number;
    // history: List<List<Set<number>>>;
    // possibleMoves: Set<List<number>>;
    // result: string;
    // remoteMove: string;
    path === ['possibleMoves'] || (path[0] === 'history' && path.length === 3);

  const reviver = (
    key: string | number,
    sequence: Collection.Keyed<string, any> | Collection.Indexed<any>,
    path: (string | number)[] | undefined,
  ) => {
    return isKeyed(sequence)
      ? sequence.toMap()
      : path && isSetPath(path)
      ? sequence.toSet()
      : sequence.toList();
  };
  if (ok) {
    // we want an object (not a Map) containing immutable types
    return fromJS(data, reviver).toObject() as UpdatedGameType;
  }
  throw Error(`${status} ${problem}`);
};

export const getData = (): Promise<UpdatedGameType> => {
  return api.get<UpdatedGameType>('/start').then(checkResponse);
};
export const postData = (
  stateOfGame: StateOfGameType,
  move: List<number> | null,
): Promise<UpdatedGameType> => {
  return api.post<UpdatedGameType>('/move', { move, stateOfGame }).then(checkResponse);
};
