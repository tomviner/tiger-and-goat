import React from 'react';
import { ItemTypes } from './Constants';
import { useDrag } from 'react-dnd';
import { getClsNames } from './utils';

export interface PieceProps {
  type: string;
}

function Piece({ type }: PieceProps): JSX.Element {
  // const [{ isDragging }, drag] = useDrag(() => ({
  //   type,
  //   collect: (monitor) => ({
  //     isDragging: !!monitor.isDragging(),
  //   }),
  // }));

  const pieceClsNames = getClsNames({}, `${type} piece`);

  return (
    <div
      className={pieceClsNames}
      // ref={drag}
      // style={{
      //   opacity: isDragging ? 0.5 : 1,
      //   fontSize: 25,
      //   fontWeight: 'bold',
      //   cursor: 'move',
      // }}
    ></div>
  );
}

export default Piece;
