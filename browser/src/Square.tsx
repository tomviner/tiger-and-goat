import _ from 'lodash';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { ItemTypes } from './Constants';
import Piece from './Piece';
import './Square.css';
import {
  goatsState,
  numGoatsToPlaceState,
  possibleMovesState,
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

function Square({ x, y }: SquareProps): JSX.Element {
  const [tigers, setTigers] = useRecoilState(tigersState);
  const [goats, setGoats] = useRecoilState(goatsState);
  const setNumGoatsToPlace = useSetRecoilState(numGoatsToPlaceState);
  const possibleMoves = useRecoilValue(possibleMovesState);

  const pos_num: number = 5 * y + x;

  const visible = x < 4 && y < 4;
  const diagBackward = (x + y) % 2 === 0;

  const canMove = (pos_num: number) => {
    possibleMoves;
    return ![...tigers, ...goats].includes(pos_num);
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    to_pos_num: number,
  ) => void = (itemType, item, to_pos_num) => {
    if (item.toPlace) {
      setNumGoatsToPlace((oldNum) => oldNum - 1);
    }
    const setter = itemType === ItemTypes.TIGER ? setTigers : setGoats;
    setter((oldPieces) => {
      return [..._.filter(oldPieces, (val) => val !== item.pos_num), to_pos_num];
    });
  };

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: () => canMove(pos_num),
      drop: (item, monitor) => doMove(monitor.getItemType(), item as ItemType, pos_num),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        // itemType: monitor.getItemType(),
        // item: monitor.getItem(),
      }),
    }),
    [x, y, tigers, goats],
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
    </div>
  );
}

export default Square;
