import { List } from 'immutable';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { postData } from './api';
import { ItemTypes } from './Constants';
import { JUMPS_GRAPH, STEPS_GRAPH } from './graph';
import Piece from './Piece';
import './Square.css';
import {
  goatsState,
  playerNumState,
  playersTurnState,
  possibleMovesState,
  stateOfGameState,
  tigersState,
  updatedGameState,
} from './State';
import { average, getClsNames } from './utils';

export interface SquareProps {
  x: number;
  y: number;
}

export interface ItemType {
  toPlace: boolean;
  posNum: number;
}

const getMove = (toPlace: boolean, fromPosNum: number, toPosNum: number) => {
  if (toPlace) {
    return List([toPosNum]);
  }
  const canStepTo = STEPS_GRAPH.get(fromPosNum);
  if (canStepTo && canStepTo.includes(toPosNum)) {
    return List([fromPosNum, toPosNum]);
  }

  const canJumpTo = JUMPS_GRAPH.get(fromPosNum);
  if (canJumpTo && canJumpTo.includes(toPosNum)) {
    const eaten = average(fromPosNum, toPosNum);
    return List([fromPosNum, eaten, toPosNum]);
  }
  return List();
};

function Square({ x, y }: SquareProps): JSX.Element {
  const playerNum = useRecoilValue(playerNumState);
  const tigers = useRecoilValue(tigersState);
  const goats = useRecoilValue(goatsState);
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const possibleMoves = useRecoilValue(possibleMovesState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const playersTurn = useRecoilValue(playersTurnState);

  const posNum: number = 5 * y + x;
  const visible = x < 4 && y < 4;
  const diagBackward = (x + y) % 2 === 0;

  const canMove = (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => {
    const move = getMove(item.toPlace, item.posNum, toPosNum);

    const correctTurn = itemType === playersTurn.type;
    const squareFree = !tigers.concat(goats).includes(toPosNum);
    return correctTurn && squareFree && possibleMoves.includes(move);
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => void = (itemType, item, toPosNum) => {
    const move = getMove(item.toPlace, item.posNum, toPosNum);

    // setPlayerNum((oldPlayerNum) => 3 - oldPlayerNum);
    // if (item.toPlace) {
    //   setNumGoatsToPlace((oldNum) => oldNum - 1);
    // }
    // const setter = itemType === ItemTypes.TIGER ? setTigers : setGoats;
    // setter((oldPieces) => {
    //   return oldPieces.filterNot((val) => val === item.posNum).push(toPosNum);
    // });

    console.log('POST', JSON.stringify({ move, stateOfGame }));
    const res = postData(stateOfGame, move);
    res.then(setUpdatedGame).catch(console.error);
  };

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: (item, monitor) =>
        canMove(monitor.getItemType(), item as ItemType, posNum),
      drop: (item, monitor) => doMove(monitor.getItemType(), item as ItemType, posNum),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [x, y, playerNum, possibleMoves, history],
  );

  const squareClsNames = getClsNames(
    {
      visibleSquare: visible,
      diagForward: visible && !diagBackward,
      diagBackward: visible && diagBackward,
      isOver,
      cannotDrop: isOver && !canDrop,
    },
    'square',
  );

  const piece = tigers.includes(posNum) ? (
    <Piece type="tiger" posNum={posNum} />
  ) : goats.includes(posNum) ? (
    <Piece type="goat" posNum={posNum} />
  ) : null;

  return (
    <div className={squareClsNames} key={posNum} ref={drop}>
      {piece}
      {posNum}
    </div>
  );
}

export default Square;
