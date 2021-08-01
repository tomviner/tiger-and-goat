import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ItemTypes } from './Constants';
import Piece from './Piece';
import './Square.css';
import { goatsState, tigersState } from './State';
import Target from './Target';
import { getClsNames } from './utils';

export interface SquareProps {
  x: number;
  y: number;
}

function Square({ x, y }: SquareProps): JSX.Element {
  const posNum = 5 * y + x;
  // console.log('render Square', posNum);
  const [pieceUnderDrag, setPieceUnderDrag] = useState(false);
  const tigers = useRecoilValue(tigersState);
  const goats = useRecoilValue(goatsState);

  // right column and bottom row are not visible
  const visible = x < 4 && y < 4;
  // backward & forward refer to the direction of slash characters
  const diagBackward = (x + y) % 2 === 0;

  const squareClsNames = getClsNames(
    {
      visibleSquare: visible,
      diagForward: visible && !diagBackward,
      diagBackward: visible && diagBackward,
    },
    'square',
  );

  const getPiece = (isTiger: boolean, isGoat: boolean) => {
    // console.log('build piece', posNum, isTiger, isGoat);
    const type = isTiger ? ItemTypes.TIGER : isGoat ? ItemTypes.GOAT : null;
    if (type !== null) {
      return (
        <Piece
          key={`P${posNum}`}
          type={type}
          posNum={posNum}
          setPieceUnderDrag={setPieceUnderDrag}
        />
      );
    } else {
      return null;
    }
  };

  return (
    <div className={squareClsNames} key={posNum}>
      <Target key={`Ta${posNum}`} posNum={posNum} pieceUnderDrag={pieceUnderDrag} />
      {getPiece(tigers.includes(posNum), goats.includes(posNum))}
      {posNum}
    </div>
  );
}

export default Square;
