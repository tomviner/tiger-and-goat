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
  historyState,
  numGoatsToPlaceState,
  playerNumState,
  playersTurnState,
  possibleMovesState,
  priorGameState,
  tigersState,
} from './State';
import { getClsNames } from './utils';

export interface SquareProps {
  x: number;
  y: number;
}

export interface ItemType {
  toPlace: boolean;
  pos_num: number;
}

const average = (a: number, b: number) => (a + b) / 2;

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
  const [tigers, setTigers] = useRecoilState(tigersState);
  const [goats, setGoats] = useRecoilState(goatsState);
  const setNumGoatsToPlace = useSetRecoilState(numGoatsToPlaceState);
  const [possibleMoves, setPossibleMoves] = useRecoilState(possibleMovesState);
  const setHistory = useSetRecoilState(historyState);
  const priorGame = useRecoilValue(priorGameState);
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
    const squareFree = ![...tigers.toJS(), ...goats.toJS()].includes(to_pos_num);
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
    const setter = itemType === ItemTypes.TIGER ? setTigers : setGoats;
    setter((oldPieces) => {
      return oldPieces.filterNot((val) => val === item.pos_num).push(to_pos_num);
    });

    console.log('POST', JSON.stringify({ move, priorGame }));
    const res = postData(move, priorGame);
    res
      .then((updatedGame) => {
        const { playerNum, numGoatsToPlace, tigers, goats, possibleMoves, history } =
          updatedGame;
        console.log('>>> ', {
          playerNum,
          numGoatsToPlace,
          tigers: JSON.stringify(tigers.toJS()),
          goats: JSON.stringify(goats.toJS()),
          possibleMoves: JSON.stringify(possibleMoves.toJS()),
          history: JSON.stringify(history.toJS()),
        });
        setPlayerNum(playerNum);
        setNumGoatsToPlace(numGoatsToPlace);
        setTigers(tigers);
        setGoats(goats);
        setPossibleMoves(possibleMoves);
        setHistory(history);
      })
      .catch(console.error);
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
        // itemType: monitor.getItemType(),
        // item: monitor.getItem(),
      }),
    }),
    [x, y, playerNum, tigers, goats, possibleMoves, history, priorGame],
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
