import { ApiResponse, create } from 'apisauce';
import { Collection, fromJS, isKeyed, List } from 'immutable';
import { StateOfGameType, UpdatedGameType } from './State';

const api = create({
  baseURL: 'http://localhost:8000',
});

export type Controller =
  | { type: 'human' }
  | { type: 'ai'; depth: number }
  | { type: 'jev' }
  | { type: 'strategy'; name: string };

export interface Controllers {
  goat: Controller;
  tiger: Controller;
}

export interface StrategyInfo {
  name: string;
  side: number;
  sideName: string;
  description: string;
}

export interface OpponentsInfo {
  strategies: StrategyInfo[];
  depth: { min: number; max: number; default: number };
}

export interface JevMove {
  move: number[];
  confidence: number | null;
  model: string | null;
}

export async function getJevMove(
  state: { playerNum: number; numGoatsToPlace: number; history: number[][][] },
  possibleMoves: number[][],
): Promise<JevMove> {
  const response = await fetch('/api/jev', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state, possibleMoves }),
  });
  const body = await response.text();
  let data: JevMove | { error?: string };
  try {
    data = JSON.parse(body) as JevMove | { error?: string };
  } catch {
    throw new Error(
      response.ok
        ? 'Jev returned an invalid response'
        : `Jev service unavailable (${response.status})`,
    );
  }
  if (!response.ok) {
    throw new Error(
      'error' in data && data.error ? data.error : `Jev failed (${response.status})`,
    );
  }
  return data as JevMove;
}

export const getOpponents = (): Promise<OpponentsInfo> =>
  api.get<OpponentsInfo>('/opponents').then((value) => {
    if (value.ok && value.data) {
      return value.data;
    }
    throw Error(`${value.status} ${value.problem}`);
  });

// Convert a plain /move or /start payload (from the server or the local engine)
// into the Immutable shape the app uses.
export const parseUpdatedGame = (data: unknown): UpdatedGameType => {
  const isSetPath = (path: (string | number)[]) =>
    // playerNum: number;
    // numGoatsToPlace: number;
    // history: List<List<Set<number>>>;
    // possibleMoves: Set<List<number>>;
    // result: string;
    // remoteMove: string;
    (path[0] === 'possibleMoves' && path.length === 1) ||
    (path[0] === 'history' && path.length === 3);

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
  // we want an object (not a Map) containing immutable types
  return fromJS(data, reviver).toObject() as unknown as UpdatedGameType;
};

const checkResponse = (value: ApiResponse<UpdatedGameType>) => {
  const { ok, data, problem, status } = value;
  if (ok) {
    return parseUpdatedGame(data);
  }
  throw Error(`${status} ${problem}`);
};

export const getData = (): Promise<UpdatedGameType> => {
  return api.get<UpdatedGameType>('/start').then(checkResponse);
};
export const postData = (
  stateOfGame: StateOfGameType,
  move: List<number> | null,
  controllers: Controllers,
): Promise<UpdatedGameType> => {
  return api
    .post<UpdatedGameType>('/move', { move, stateOfGame, controllers })
    .then(checkResponse);
};
