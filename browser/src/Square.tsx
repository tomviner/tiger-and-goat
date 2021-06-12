import { List } from 'immutable';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { postData } from './api';
import { ItemTypes } from './Constants';
import { JUMPS_GRAPH, STEPS_GRAPH } from './graph';
import Piece from './Piece';
import './Square.css';
import {
  goatsState,
  numGoatsToPlaceState,
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
  pos_num: number;
}

const getMove = (toPlace: boolean, from_pos_num: number, to_pos_num: number) => {
  if (toPlace) {
    return List([to_pos_num]);
  }
  const canStepTo = STEPS_GRAPH.get(from_pos_num);
  if (canStepTo && canStepTo.includes(to_pos_num)) {
    return List([from_pos_num, to_pos_num]);
  }

  const canJumpTo = JUMPS_GRAPH.get(from_pos_num);
  if (canJumpTo && canJumpTo.includes(to_pos_num)) {
    const eaten = average(from_pos_num, to_pos_num);
    return List([from_pos_num, eaten, to_pos_num]);
  }
  return List();
};

function Square({ x, y }: SquareProps): JSX.Element {
  const [playerNum, setPlayerNum] = useRecoilState(playerNumState);
  const tigers = useRecoilValue(tigersState);
  const goats = useRecoilValue(goatsState);
  const setNumGoatsToPlace = useSetRecoilState(numGoatsToPlaceState);
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const possibleMoves = useRecoilValue(possibleMovesState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const playersTurn = useRecoilValue(playersTurnState);

  const pos_num: number = 5 * y + x;
  const visible = x < 4 && y < 4;
  const diagBackward = (x + y) % 2 === 0;

  const canMove = (
    itemType: string | symbol | null,
    item: ItemType,
    to_pos_num: number,
  ) => {
    const move = getMove(item.toPlace, item.pos_num, to_pos_num);

    const correctTurn = itemType === playersTurn.type;
    const squareFree = !tigers.concat(goats).includes(to_pos_num);
    return correctTurn && squareFree && possibleMoves.includes(move);
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    to_pos_num: number,
  ) => void = (itemType, item, to_pos_num) => {
    const move = getMove(item.toPlace, item.pos_num, to_pos_num);

    setPlayerNum((oldPlayerNum) => 3 - oldPlayerNum);
    if (item.toPlace) {
      setNumGoatsToPlace((oldNum) => oldNum - 1);
    }
    // const setter = itemType === ItemTypes.TIGER ? setTigers : setGoats;
    // setter((oldPieces) => {
    //   return oldPieces.filterNot((val) => val === item.pos_num).push(to_pos_num);
    // });

    console.log('POST', JSON.stringify({ move, stateOfGame }));
    const res = postData(stateOfGame, move);
    res.then(setUpdatedGame).catch(console.error);
  };

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: (item, monitor) =>
        canMove(monitor.getItemType(), item as ItemType, pos_num),
      drop: (item, monitor) => doMove(monitor.getItemType(), item as ItemType, pos_num),
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
      hiddenSquare: !visible,
      diagForward: visible && !diagBackward,
      diagBackward: visible && diagBackward,
      isOver,
      cannotDrop: isOver && !canDrop,
    },
    'square',
  );

  const piece = tigers.includes(pos_num) ? (
    <Piece type="tiger" pos_num={pos_num} />
  ) : goats.includes(pos_num) ? (
    <Piece type="goat" pos_num={pos_num} />
  ) : null;

  return (
    <div className={squareClsNames} key={pos_num} ref={drop}>
      {piece}
      {pos_num}
    </div>
  );
}

export default Square;
