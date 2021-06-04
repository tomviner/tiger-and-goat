import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import _ from 'lodash';
import Piece from './Piece';

import { ItemTypes } from './Constants';
import { tigersState, goatsState, numGoatsToPlaceState } from './State';
import './Square.css';

import { getClsNames } from './utils';

export interface SquareProps {
  x: number;
  y: number;
}

function Square({ x, y }: SquareProps): JSX.Element {
  const [tigers, setTigers] = useRecoilState(tigersState);
  const [goats, setGoats] = useRecoilState(goatsState);
  const [numGoatsToPlace, setNumGoatsToPlace] = useRecoilState(numGoatsToPlaceState);

  const pos_num: number = 5 * y + x;

  const visible = x < 4 && y < 4;
  const diagBackward = (x + y) % 2 === 0;

  const canMove = (pos_num: number) => {
    return ![...tigers, ...goats].includes(pos_num);
  };

  const doMove: (
    itemType: string | symbol | null,
    item: any,
    to_pos_num: number,
  ) => void = (itemType, item, to_pos_num) => {
    if (item.toPlace) {
      setNumGoatsToPlace((oldNum) => oldNum - 1);
    }
    const setter = itemType === ItemTypes.TIGER ? setTigers : setGoats;
    setter((oldPieces) => {
      return [..._.filter(oldPieces, (val) => val !== item.pos_num), pos_num];
    });
  };

  const [{ isOver, canDrop, item, itemType }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: () => canMove(pos_num),
      drop: (item, monitor) => doMove(monitor.getItemType(), item, pos_num),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        itemType: monitor.getItemType(),
        item: monitor.getItem(),
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
