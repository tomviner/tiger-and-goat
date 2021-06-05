import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSetRecoilState } from 'recoil';
import { GameType, getData } from './api';
import './board.css';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  goatsState,
  numGoatsToPlaceState,
  playerNumState,
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

  useEffect(() => {
    const res = getData();
    res
      .then((data: GameType) => {
        const { playerNum, numGoatsToPlace, tigers, goats, possibleMoves } = data;
        console.log('GET', {
          playerNum,
          numGoatsToPlace,
          tigers: JSON.stringify(tigers.toJS()),
          goats: JSON.stringify(goats.toJS()),
          possibleMoves: JSON.stringify(possibleMoves.toJS()),
        });
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
        <GoatsToPlace />
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
