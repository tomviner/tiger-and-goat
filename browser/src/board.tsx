import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRecoilState, useRecoilValue } from 'recoil';
import { GameType, getData } from './api';
import './board.css';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  goatsState,
  numGoatsEatenState,
  numGoatsToPlaceState,
  tigersState,
} from './State';
import { range2d } from './utils';

function Board(): JSX.Element {
  const [playerNum, setPlayerNum] = useState(0);
  const [tigers, setTigers] = useRecoilState(tigersState);
  const [goats, setGoats] = useRecoilState(goatsState);
  const [numGoatsToPlace, setNumGoatsToPlace] = useRecoilState(numGoatsToPlaceState);
  const turnPlayer = playerNum === 2 ? 'Tiger' : 'Goat';
  const numGoatsEaten = useRecoilValue(numGoatsEatenState);

  useEffect(() => {
    const res = getData();
    res.then((data: GameType) => {
      const { playerNum, goatsToPlace, tigers, goats } = data;
      setTigers(tigers);
      setGoats(goats);
      setPlayerNum(playerNum);
      setNumGoatsToPlace(goatsToPlace);
    });
  }, []);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div>Turn: {turnPlayer}</div>
        <div>
          To place: <GoatsToPlace />
        </div>
        <div>Eaten: {'🐐'.repeat(numGoatsEaten)}</div>
        <div className={'gameBoard'}>
          {range2d(5, 5)
            .toJS()
            .map(([x, y]) => {
              return <Square key={`${x},${y}`} x={x} y={y} />;
            })}
        </div>
      </DndProvider>
    </>
  );
}

export default Board;
