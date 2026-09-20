// One data layer, two backends. In 'server' mode we call the Python API; in
// 'local' mode we run the ported engine in the browser, so the app can be
// deployed as a purely static site with no backend.
import { List } from 'immutable';
import {
  Controllers,
  getData,
  getJevMove,
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
  const usesJev = controllers.goat.type === 'jev' || controllers.tiger.type === 'jev';
  if (mode === 'local' || usesJev) {
    const plainState = {
      playerNum: stateOfGame.playerNum,
      numGoatsToPlace: stateOfGame.numGoatsToPlace,
      history: stateOfGame.history.toJS() as number[][][],
    };
    const plainMove = move ? (move.toArray() as number[]) : null;
    try {
      const updated = localMove(plainState, plainMove, controllers);
      const turnSide = updated.playerNum === 1 ? 'goat' : 'tiger';
      if (updated.result || controllers[turnSide].type !== 'jev') {
        return Promise.resolve(parseUpdatedGame(updated));
      }

      return getJevMove(
        {
          playerNum: updated.playerNum,
          numGoatsToPlace: updated.numGoatsToPlace,
          history: updated.history,
        },
        updated.possibleMoves,
      ).then(({ move: jevMove }) => {
        const legal = updated.possibleMoves.some(
          (candidate) =>
            candidate.length === jevMove.length &&
            candidate.every((position, index) => position === jevMove[index]),
        );
        if (!legal) {
          throw new Error('Jev returned an illegal move');
        }
        const applied = localMove(
          {
            playerNum: updated.playerNum,
            numGoatsToPlace: updated.numGoatsToPlace,
            history: updated.history,
          },
          jevMove,
          { goat: { type: 'human' }, tiger: { type: 'human' } },
        );
        return parseUpdatedGame({ ...applied, remoteMove: jevMove });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return postData(stateOfGame, move, controllers);
}
