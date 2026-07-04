import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import './GoatsEaten.css';
import { lastEatenSquareState } from './State';
import { divmod, getClsNames } from './utils';

export interface GoatLastEatenProps {
  numGoatsEaten: number;
}

function GoatLastEaten({ numGoatsEaten }: GoatLastEatenProps): JSX.Element {
  if (numGoatsEaten < 0) {
    console.warn('numGoatsEaten is', numGoatsEaten);
    numGoatsEaten = 0;
  }

  const eatenSquare = useRecoilValue(lastEatenSquareState);

  // Render once at the captured square, then settle into the eaten pile; the
  // CSS transition glides between the two. GoatsEaten remounts this per capture
  // (key=numGoatsEaten), so each eaten goat animates once, from whichever side
  // captured it (AI or a human in hotseat).
  const [settled, setSettled] = useState(false);
  const animateFromBoard = eatenSquare !== null && !settled;

  useEffect(() => {
    setSettled(true);
  }, []);

  const getStyle = () => {
    if (animateFromBoard && eatenSquare !== null) {
      const [oldY, oldX] = divmod(eatenSquare, 5);
      return {
        left: `${(oldX - 2) * 100 - 35}px`,
        bottom: `${(5 - oldY) * 100 + 35}px`,
      };
    }
    return {
      left: `${numGoatsEaten * 20 - 20}px`,
    };
  };

  const clsNames = getClsNames({ applyMove: animateFromBoard }, 'goatLastEaten');

  return (
    <div className="goatLastEatenWrapper">
      <div className={clsNames} style={getStyle()}>
        🐐
      </div>
    </div>
  );
}

export default GoatLastEaten;
