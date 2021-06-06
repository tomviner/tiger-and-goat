import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSetRecoilState } from 'recoil';
import { getData } from './api';
import './board.css';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  goatsState,
  historyState,
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
  const setHistory = useSetRecoilState(historyState);

  useEffect(() => {
    const res = getData();
    res
      .then((updatedGame) => {
        const { playerNum, numGoatsToPlace, tigers, goats, possibleMoves, history } =
          updatedGame;
        console.log(
          'GET',
          JSON.stringify({
            playerNum,
            numGoatsToPlace,
            tigers: JSON.stringify(tigers.toJS()),
            goats: JSON.stringify(goats.toJS()),
            possibleMoves: JSON.stringify(possibleMoves.toJS()),
            history: JSON.stringify(history.toJS()),
          }),
        );
        setPlayerNum(playerNum);
        setNumGoatsToPlace(numGoatsToPlace);
        setTigers(tigers);
        setGoats(goats);
        setPossibleMoves(possibleMoves);
        setHistory(history);
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
