import React, { useEffect, useState } from 'react';
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
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    const res = getData();
    res.then(setUpdatedGame).catch(console.error);
  }, []);

  const swap = () => {
    const res = postData(stateOfGame, null);
    res.then(setUpdatedGame).catch(console.error);
  };

  // Auto (AI vs AI): after each position settles, play the next ply for the
  // side to move. Stops once the game is over so we don't loop on a finished
  // board.
  useEffect(() => {
    if (!autoPlay || result || !stateOfGame.history.size) {
      return;
    }
    const timer = setTimeout(swap, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, result, stateOfGame]);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="result">{result}</div>
        <div className="controls">
          <span>
            Turn: <b>{playersTurn.name}</b>
          </span>
          <button onClick={swap}>Swap</button>
          <button onClick={() => setAutoPlay((on) => !on)}>
            {autoPlay ? 'Stop auto' : 'Auto (AI vs AI)'}
          </button>
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
