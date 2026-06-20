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
  const remoteMoveObj =
    remoteMove !== null && remoteMove !== undefined ? Move.fromList(remoteMove) : null;

  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { fromPosNum: posNum, toPlace: false },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
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

  // After the piece renders offset back to its source square, flip the flag so
  // a re-render clears the offset and the CSS transition glides it forward.
  useEffect(() => {
    setRemoteMoveApplied(justMoved);
  }, [remoteMove]);

  const getStyle = () => {
    if (setOldRemoteMove) {
      if (remoteMoveObj?.toPlace) {
        return {
          right: `${65 + 100 * (x - 2)}px`,
          bottom: `${75 + 100 * (y + 0.5)}px`,
          transform: `scale(${16 / 50})`,
        };
      } else if (remoteMoveObj?.fromPosNum !== null) {
        const [oldY, oldX] = divmod(remoteMoveObj?.fromPosNum as number, 5);
        // Start the FLIP animation from the source square. Tigers and goats
        // share the same resting offset (right: 65px, bottom: 75px), so both
        // keep that base when offsetting back to the source.
        return {
          right: `${65 + 100 * (x - oldX)}px`,
          bottom: `${75 + 100 * (y - oldY)}px`,
        };
      }
    }
    return {};
  };

  const clsNames = getClsNames(
    {
      isDragging,
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
  return <div className={clsNames} ref={attachRef} style={style} key={posNum}></div>;
}

export default Piece;
