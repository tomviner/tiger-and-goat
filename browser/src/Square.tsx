import React from 'react';
import Piece from './Piece';
import { ItemTypes } from './Constants';

import { getClsNames } from './utils';

export interface SquareProps {
  x: number;
  y: number;
  tigers: number[];
  goats: number[];
}

function Square({ x, y, tigers, goats }: SquareProps): JSX.Element {
  const pos_num: number = 5 * y + x;

  const visible = x < 4 && y < 4;
  const diagBackward = (x + y) % 2 === 0;

  const boxClsNames = getClsNames(
    {
      visibleBox: visible,
      hiddenBox: !visible,
      diagForward: visible && !diagBackward,
      diagBackward: visible && diagBackward,
    },
    'box',
  );

  const piece = tigers.includes(pos_num) ? (
    <Piece type="tiger" />
  ) : goats.includes(pos_num) ? (
    <Piece type="goat" />
  ) : null;

  return (
    <div className={boxClsNames} key={pos_num}>
      {piece}
    </div>
  );
}

export default Square;
