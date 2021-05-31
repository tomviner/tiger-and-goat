import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Square from './Square';
import { range2d } from './utils';
import './board.css';
import { getData, GameType } from './api';

function Board(): JSX.Element {
  const [playerNum, setPlayerNum] = useState(0);
  const [goatsToPlace, setGoatsToPlace] = useState(0);
  const [tigers, setTigers] = useState<number[]>([]);
  const [goats, setGoats] = useState<number[]>([]);
  const turnPlayer = playerNum === 2 ? 'Tiger' : 'Goat';
  const goatsEaten = 20 - goatsToPlace - goats.length;

  useEffect(() => {
    const res = getData();
    res.then((data: GameType) => {
      const { playerNum, goatsToPlace, tigers, goats } = data;
      setPlayerNum(playerNum);
      setGoatsToPlace(goatsToPlace);
      setTigers(tigers);
      setGoats(goats);
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div>Turn: {turnPlayer}</div>
      <div>To place: {'🐐'.repeat(goatsToPlace)}</div>
      <div>Eaten: {'🐐'.repeat(goatsEaten)}</div>
      <div className={'gameBoard'}>
        {range2d(5, 5)
          .toJS()
          .map(([x, y]) => {
            const key = `${x},${y}`;
            return <Square key={key} {...{ x, y, tigers, goats }} />;
          })}
      </div>
    </DndProvider>
  );
}

export default Board;
