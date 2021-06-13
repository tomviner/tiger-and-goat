import React from 'react';
import { useDrag } from 'react-dnd';
import './Piece.css';
import { getClsNames } from './utils';

export interface PieceProps {
  type: string;
  posNum: number;
}

function Piece({ type, posNum }: PieceProps): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { posNum, toPlace: false },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const pieceClsNames = getClsNames({ isDragging }, `${type} piece`);

  return <div className={pieceClsNames} ref={drag}></div>;
}

export default Piece;
