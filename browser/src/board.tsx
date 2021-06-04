import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Square from './Square';
import GoatsToPlace from './GoatsToPlace';
import { tigersState, goatsState, numGoatsToPlaceState } from './State';
import { range2d } from './utils';
import './board.css';
import { getData, GameType } from './api';

function Board(): JSX.Element {
  const [playerNum, setPlayerNum] = useState(0);
  const [tigers, setTigers] = useRecoilState(tigersState);
  const [goats, setGoats] = useRecoilState(goatsState);
  const [numGoatsToPlace, setNumGoatsToPlace] = useRecoilState(numGoatsToPlaceState);
  useRecoilState;
  const turnPlayer = playerNum === 2 ? 'Tiger' : 'Goat';
  const goatsEaten = 20 - numGoatsToPlace - goats.length;

  useEffect(() => {
    const res = getData();
    res.then((data: GameType) => {
      const { playerNum, goatsToPlace, tigers, goats } = data;
      setPlayerNum(playerNum);
      setNumGoatsToPlace(goatsToPlace);
      setTigers(tigers);
      setGoats(goats);
    });
  }, []);

  console.log({ goatsEaten });
  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div>Turn: {turnPlayer}</div>
        <div>
          To place: <GoatsToPlace numGoatsToPlace={numGoatsToPlace} />
        </div>
        <div>Eaten: {'🐐'.repeat(goatsEaten)}</div>
        <div className={'gameBoard'}>
          {range2d(5, 5)
            .toJS()
            .map(([x, y]) => {
              const key = `${x},${y}`;
              return <Square key={key} x={x} y={y} />;
            })}
        </div>
      </DndProvider>
    </>
  );
}

export default Board;
