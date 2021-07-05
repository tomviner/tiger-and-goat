import { List } from 'immutable';
import React from 'react';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { useRecoilValue } from 'recoil';
import { ItemTypes } from './Constants';
import './Piece.css';
import { remoteMoveState } from './State';
import { getClsNames } from './utils';

export interface PieceProps {
  type: string;
  posNum: number;
  setPieceUnderDrag: (value: boolean) => void;
}

export interface getDropResultType {
  move: List<number>;
}

function Piece({ type, posNum, setPieceUnderDrag }: PieceProps): JSX.Element {
  const remoteMove = useRecoilValue(remoteMoveState);

  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { posNum, toPlace: false },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        // const { move } = monitor.getDropResult() as getDropResultType;
        // console.log('move', move.toJS());
      }
    },
  }));

  const [{ isUnder }, drop] = useDrop(() => ({
    accept: [ItemTypes.TIGER, ItemTypes.GOAT],
    canDrop: () => false,
    collect: (monitor) => ({ isUnder: !!monitor.isOver() }),
  }));

  setPieceUnderDrag(isUnder);

  const pieceClsNames = getClsNames({ isDragging }, `${type} piece`);

  const w = Math.floor(Math.random() * 10);
  const style = {
    transform: `translate(${w}px, 0)`,
    transition: 'all 0.5s ease-in-out',
  };

  function attachRef(el: ConnectableElement) {
    drag(el);
    drop(el);
  }
  return <div className={pieceClsNames} ref={attachRef} style={style}></div>;
}

export default Piece;
