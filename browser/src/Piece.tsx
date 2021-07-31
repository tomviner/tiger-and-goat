import { List } from 'immutable';
import React, { useEffect, useState } from 'react';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { useRecoilValue } from 'recoil';
import { ItemTypes } from './Constants';
import { Move } from './move';
import './Piece.css';
import { remoteMoveState } from './State';
import { divmod, getClsNames } from './utils';

export interface PieceProps {
  type: string;
  posNum: number;
  setPieceUnderDrag: (value: boolean) => void;
}

export interface getDropResultType {
  move: List<number>;
}

export interface ItemType {
  toPlace: boolean;
  fromPosNum: number;
}

function Piece({ type, posNum, setPieceUnderDrag }: PieceProps): JSX.Element {
  const remoteMove = useRecoilValue(remoteMoveState);
  const [remoteMoveApplied, setRemoteMoveApplied] = useState(false);

  const [y, x] = divmod(posNum, 5);
  // console.log(
  //   '1 remoteMove',
  //   remoteMove?.toJS(),
  //   remoteMove !== null,
  //   remoteMove !== undefined,
  //   remoteMove !== null && remoteMove !== undefined,
  // );
  const remoteMoveObj =
    remoteMove !== null && remoteMove !== undefined ? Move.fromList(remoteMove) : null;
  // console.log('2 remoteMoveObj', remoteMoveObj?.toJS());
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

  const [{ isUnder, isUnderSelf }, drop] = useDrop(() => ({
    accept: [ItemTypes.TIGER, ItemTypes.GOAT],
    canDrop: () => false,
    collect: (monitor) => ({
      isUnder: monitor.isOver(),
      isUnderSelf: (monitor.getItem() as ItemType)?.fromPosNum == posNum,
    }),
  }));

  useEffect(() => {
    setPieceUnderDrag(isUnder && !isUnderSelf);
  }, [isUnder, isUnderSelf]);

  const justMoved = remoteMoveObj?.toPosNum === posNum;
  const setOldRemoteMove = justMoved && !remoteMoveApplied;

  useEffect(() => {
    // const moveClsNames: Record<string, unknown> = {};
    // let dx = 0;
    // // Math.floor(Math.random() * 10);
    // let dy = 0;

    // if (remoteMoveObj?.toPosNum === posNum) {
    //   console.log('----', remoteMoveObj && remoteMove
    // Obj.toList().toJS(), 'to', posNum);

    //   if (remoteMoveObj.toPlace) {
    setRemoteMoveApplied(justMoved);
    //     moveClsNames['toPlace'] = true;
    //     dx = -10;
    //     dy = -10;
    //   } else if (remoteMoveObj.fromPosNum !==
    // null && remoteMoveObj.toPosNum !== null) {
    //     if (remoteMoveObj.eaten === null) {
    //       dx = 20;
    //       dy = -20;
    //     } else {
    //       dx = -30;
    //       dy = 30;
    //     }
    //   }
    // }
  }, [remoteMove]);

  // const style = {
  //   // right: `${65 + dx * 0.9}px`,
  //   // bottom: `${75 + dy * 0.9}px`,
  //   // transform: `translate(10%, 30%)`,
  //   // ${dx}px, ${dy}px
  //   // transition: 'all 1s ease-in-out',
  // };
  // if (Object.keys(style).length) {
  //   // console.log(style);
  // }

  const getStyle = () => {
    if (setOldRemoteMove) {
      console.log('type', type, 'remoteMoveObj', remoteMoveObj?.toJS());
      if (remoteMoveObj?.toPlace) {
        console.log(type, 'place');
        return {
          right: `${65 + 100 * (x - 2)}px`,
          bottom: `${75 + 100 * (y + 0.5)}px`,
          transform: `scale(${16 / 50})`,
        };
      } else if (remoteMoveObj?.fromPosNum !== null) {
        const [oldY, oldX] = divmod(remoteMoveObj?.fromPosNum as number, 5);
        console.log(type, 'move or step');
        if (type == ItemTypes.GOAT) {
          return {
            right: `${100 * (x - oldX)}px`,
            bottom: `${100 * (y - oldY)}px`,
          };
        } else {
          return {
            right: `${65 + 100 * (x - oldX)}px`,
            bottom: `${75 + 100 * (y - oldY)}px`,
          };
        }
      }
    }
    return {};
  };

  const clsNames = getClsNames(
    {
      isDragging,
      // toPlace,
      // toSetToPlace: toSetToPlace && !toPlace,
      // setOldRemoteMoveIsPlace: (setOldRemoteMove &&
      // remoteMoveObj?.toPlace) as boolean,
      justMoved: !!justMoved,
      notJustMoved: !justMoved,
    },
    `${type} piece`,
  );

  function attachRef(el: ConnectableElement) {
    drag(el);
    drop(el);
  }

  const style = getStyle();
  // if (Object.keys(style).length) {
  //   console.log(JSON.stringify(style));
  // }
  return <div className={clsNames} ref={attachRef} style={style} key={posNum}></div>;
}

export default Piece;
