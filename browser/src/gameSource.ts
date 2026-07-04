// One data layer, two backends. In 'server' mode we call the Python API; in
// 'local' mode we run the ported engine in the browser, so the app can be
// deployed as a purely static site with no backend.
import { List } from 'immutable';
import {
  Controllers,
  getData,
  getOpponents,
  OpponentsInfo,
  parseUpdatedGame,
  postData,
} from './api';
import { localDescribe, localMove, localOpponents, localStart } from './engine/local';
import { EngineMode, StateOfGameType, UpdatedGameType } from './State';

export type { EngineMode };

// Inspect an arbitrary state (no move played). Always uses the local engine —
// it's a pure recompute, so it works regardless of the selected mode.
export function describeState(stateOfGame: {
  playerNum: number;
  numGoatsToPlace: number;
  history: number[][][];
}): UpdatedGameType {
  return parseUpdatedGame(localDescribe(stateOfGame));
}

export function fetchStart(mode: EngineMode): Promise<UpdatedGameType> {
  if (mode === 'local') {
    return Promise.resolve(parseUpdatedGame(localStart()));
  }
  return getData();
}

export function fetchOpponents(mode: EngineMode): Promise<OpponentsInfo> {
  if (mode === 'local') {
    return Promise.resolve(localOpponents());
  }
  return getOpponents();
}

export function sendMove(
  mode: EngineMode,
  stateOfGame: StateOfGameType,
  move: List<number> | null,
  controllers: Controllers,
): Promise<UpdatedGameType> {
  if (mode === 'local') {
    const plainState = {
      playerNum: stateOfGame.playerNum,
      numGoatsToPlace: stateOfGame.numGoatsToPlace,
      history: stateOfGame.history.toJS() as number[][][],
    };
    const plainMove = move ? (move.toArray() as number[]) : null;
    try {
      return Promise.resolve(
        parseUpdatedGame(localMove(plainState, plainMove, controllers)),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return postData(stateOfGame, move, controllers);
}
