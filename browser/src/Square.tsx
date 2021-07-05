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
  const [pieceUnderDrag, setPieceUnderDrag] = useState(false);
  const tigers = useRecoilValue(tigersState);
  const goats = useRecoilValue(goatsState);

  const posNum = 5 * y + x;
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

  const piece = tigers.includes(posNum) ? (
    <Piece
      type={ItemTypes.TIGER}
      posNum={posNum}
      setPieceUnderDrag={setPieceUnderDrag}
    />
  ) : goats.includes(posNum) ? (
    <Piece
      type={ItemTypes.GOAT}
      posNum={posNum}
      setPieceUnderDrag={setPieceUnderDrag}
    />
  ) : null;

  return (
    <div className={squareClsNames} key={posNum}>
      <Target key={posNum} posNum={posNum} pieceUnderDrag={pieceUnderDrag} />
      {piece}
      {posNum}
    </div>
  );
}

export default Square;
