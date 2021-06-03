import React from 'react';
import { ItemTypes } from './Constants';
import { useDrag } from 'react-dnd';
import { getClsNames } from './utils';
import './Piece.css';

export interface PieceProps {
  type: string;
  pos_num: number;
}

function Piece({ type, pos_num }: PieceProps): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { pos_num },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const pieceClsNames = getClsNames({ isDragging }, `${type} piece`);

  return <div className={pieceClsNames} ref={drag}></div>;
}

export default Piece;
