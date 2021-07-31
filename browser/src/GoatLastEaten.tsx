import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import './GoatsEaten.css';
import { Move } from './move';
import { remoteMoveState } from './State';
import { divmod, getClsNames } from './utils';

export interface GoatLastEatenProps {
  numGoatsEaten: number;
}

function GoatLastEaten({ numGoatsEaten }: GoatLastEatenProps): JSX.Element {
  // console.log('render GoatLastEaten');
  if (numGoatsEaten < 0) {
    console.warn('numGoatsEaten is', numGoatsEaten);
    numGoatsEaten = 0;
  }

  const [remoteMoveApplied, setRemoteMoveApplied] = useState(false);

  // let numGoatLastEaten = useRecoilValue(numGoatLastEatenState);
  const remoteMove = useRecoilValue(remoteMoveState);

  const remoteMoveObj = remoteMove ? Move.fromList(remoteMove) : null;

  const justEaten = remoteMoveObj?.eaten !== null;
  const applyMove = justEaten && !remoteMoveApplied;

  const getStyle = () => {
    if (applyMove) {
      const [oldY, oldX] = divmod(remoteMoveObj?.eaten as number, 5);
      return {
        left: `${(oldX - 2) * 100 - 35}px`,
        bottom: `${(5 - oldY) * 100 + 35}px`,
      };
    }
    return {
      left: `${numGoatsEaten * 20 - 20}px`,
    };
  };

  useEffect(() => {
    setRemoteMoveApplied(justEaten);
  }, [justEaten]);

  const clsNames = getClsNames({ applyMove }, 'goatLastEaten');

  return (
    <div className="goatLastEatenWrapper">
      <div className={clsNames} style={getStyle()}>
        🐐
      </div>
    </div>
  );
}

export default GoatLastEaten;
