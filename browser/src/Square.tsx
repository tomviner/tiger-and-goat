import { List, Map, Set } from 'immutable';
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
  historyState,
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
  const history = useRecoilValue(historyState);
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);

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
    const squareFree = !tigers.union(goats).includes(toPosNum);
    return correctTurn && squareFree && possibleMoves.includes(move);
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => void = (itemType, item, toPosNum) => {
    const fromPosNum = item.posNum;
    const move = getMove(item.toPlace, fromPosNum, toPosNum);
    console.log({ fromPosNum, toPosNum });

    const newPlayerNum = 3 - playerNum;
    const newNumGoatsToPlace = item.toPlace ? numGoatsToPlace - 1 : numGoatsToPlace;

    const applyPlace = () => {
      return List.of(tigers, goats.add(toPosNum));
    };
    const applyStep = () => {
      if (itemType === ItemTypes.TIGER) {
        return List.of(tigers.remove(fromPosNum).add(toPosNum), goats);
      } else {
        return List.of(tigers, goats.remove(fromPosNum).add(toPosNum));
      }
    };
    const applyJump = () => {
      const eaten = move.get(1, -1);
      return List.of(tigers.remove(fromPosNum).add(toPosNum), goats.remove(eaten));
    };

    const applyMoveMap = Map(List.of([1, applyPlace], [2, applyStep], [3, applyJump]));
    const applyMove = applyMoveMap.get(move.size, () => List());
    const newPieces = applyMove();

    const newHistory = history.push(newPieces);
    setUpdatedGame({
      playerNum: newPlayerNum,
      numGoatsToPlace: newNumGoatsToPlace,
      history: newHistory,
      possibleMoves: Set(),
      result: '',
    });

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
    <Piece type={ItemTypes.TIGER} posNum={posNum} />
  ) : goats.includes(posNum) ? (
    <Piece type={ItemTypes.GOAT} posNum={posNum} />
  ) : null;

  return (
    <div className={squareClsNames} key={posNum} ref={drop}>
      {piece}
      {posNum}
    </div>
  );
}

export default Square;
