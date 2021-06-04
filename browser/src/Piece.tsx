import React from 'react';
import { useDrag } from 'react-dnd';
import './Piece.css';
import { getClsNames } from './utils';

export interface PieceProps {
  type: string;
  pos_num: number;
}

function Piece({ type, pos_num }: PieceProps): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { pos_num, toPlace: false },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const pieceClsNames = getClsNames({ isDragging }, `${type} piece`);

  return <div className={pieceClsNames} ref={drag}></div>;
}

export default Piece;
