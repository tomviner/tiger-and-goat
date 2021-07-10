import { List } from 'immutable';
import React, { useEffect } from 'react';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { useRecoilValue } from 'recoil';
import { ItemTypes } from './Constants';
import { Move } from './move';
import './Piece.css';
import { remoteMoveState } from './State';
import { getClsNames } from './utils';

export interface PieceProps {
  type: string;
  posNum: number;
  pieceUnderDrag: boolean;
  setPieceUnderDrag: (value: boolean) => void;
}

export interface getDropResultType {
  move: List<number>;
}

function Piece({
  type,
  posNum,
  pieceUnderDrag,
  setPieceUnderDrag,
}: PieceProps): JSX.Element {
  const remoteMove = useRecoilValue(remoteMoveState);
  // console.log(
  //   '1 remoteMove',
  //   remoteMove && remoteMove.toJS(),
  //   remoteMove !== null,
  //   remoteMove !== undefined,
  //   remoteMove !== null && remoteMove !== undefined,
  // );
  const remoteMoveObj =
    remoteMove !== null && remoteMove !== undefined ? Move.fromList(remoteMove) : null;
  // console.log('2 remoteMoveObj', remoteMoveObj && remoteMoveObj.toJS());
  // console.log();

  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { fromPosNum: posNum, toPlace: false },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    // end: (item, monitor) => {
    //   if (monitor.didDrop()) {
    //     // const { move } = monitor.getDropResult() as getDropResultType;
    //     // console.log('move', move.toJS());
    //   }
    // },
  }));

  const [{ isUnder }, drop] = useDrop(() => ({
    accept: [ItemTypes.TIGER, ItemTypes.GOAT],
    canDrop: () => false,
    collect: (monitor) => ({ isUnder: !!monitor.isOver() }),
  }));

  useEffect(() => {
    if (isUnder !== pieceUnderDrag) {
      setPieceUnderDrag(isUnder);
      console.log('setPieceUnderDrag', posNum, pieceUnderDrag, '-->', isUnder);
    }
  }, [isUnder]);

  const moveClsNames: Record<string, unknown> = {};
  let dx = 0;
  // Math.floor(Math.random() * 10);
  let dy = 0;

  if (remoteMoveObj && remoteMoveObj.toPosNum === posNum) {
    console.log('----', remoteMoveObj && remoteMoveObj.toList().toJS(), 'to', posNum);

    if (remoteMoveObj.toPlace) {
      moveClsNames['toPlace'] = true;
      dx = -10;
      dy = -10;
    } else if (remoteMoveObj.fromPosNum !== null && remoteMoveObj.toPosNum !== null) {
      if (remoteMoveObj.eaten === null) {
        dx = 20;
        dy = -20;
      } else {
        dx = -30;
        dy = 30;
      }
    }
  }

  const style = {
    // right: `${65 + dx * 0.9}px`,
    // bottom: `${75 + dy * 0.9}px`,
    // transform: `translate(10%, 30%)`,
    // // ${dx}px, ${dy}px
    // transition: 'all 1s ease-in-out',
  };
  if (Object.keys(style).length) {
    console.log(style);
  }
  const pieceClsNames = getClsNames({ isDragging, ...moveClsNames }, `${type} piece`);

  function attachRef(el: ConnectableElement) {
    drag(el);
    drop(el);
  }
  return (
    <div className={pieceClsNames} ref={attachRef} style={style} key={posNum}></div>
  );
}

export default Piece;
