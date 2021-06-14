import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { getData, postData } from './api';
import './board.css';
import GoatsEaten from './GoatsEaten';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  playersTurnState,
  resultState,
  stateOfGameState,
  updatedGameState,
} from './State';
import { range2d } from './utils';

function Board(): JSX.Element {
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const playersTurn = useRecoilValue(playersTurnState);
  const result = useRecoilValue(resultState);

  useEffect(() => {
    const res = getData();
    res.then(setUpdatedGame).catch(console.error);
  }, []);

  const swap = () => {
    const res = postData(stateOfGame, null);
    res.then(setUpdatedGame).catch(console.error);
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="result">{result}</div>
        <div>
          Turn: <b>{playersTurn.name}</b>
          <button onClick={swap}>Swap</button>
        </div>
        <GoatsToPlace />
        <div className={'gameBoard'}>
          {range2d(5, 5)
            .toJS()
            .map(([x, y]) => {
              return <Square key={`${x},${y}`} x={x} y={y} />;
            })}
        </div>
      </DndProvider>
      <GoatsEaten />
    </>
  );
}

export default Board;
