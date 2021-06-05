import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { GameType, getData } from './api';
import './board.css';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  goatsState,
  numGoatsEatenState,
  numGoatsToPlaceState,
  playerNumState,
  playersTurnState,
  possibleMovesState,
  tigersState,
} from './State';
import { range2d } from './utils';

function Board(): JSX.Element {
  const setPlayerNum = useSetRecoilState(playerNumState);
  const setTigers = useSetRecoilState(tigersState);
  const setGoats = useSetRecoilState(goatsState);
  const setNumGoatsToPlace = useSetRecoilState(numGoatsToPlaceState);
  const setPossibleMoves = useSetRecoilState(possibleMovesState);
  const numGoatsEaten = useRecoilValue(numGoatsEatenState);
  const playersTurn = useRecoilValue(playersTurnState);

  useEffect(() => {
    const res = getData();
    res
      .then((data: GameType) => {
        const { playerNum, numGoatsToPlace, tigers, goats, possibleMoves } = data;
        setPlayerNum(playerNum);
        setNumGoatsToPlace(numGoatsToPlace);
        setTigers(tigers);
        setGoats(goats);
        setPossibleMoves(possibleMoves);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div>Turn: {playersTurn.name}</div>
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
