import { Range } from 'immutable';
import React from 'react';
import { useRecoilValue } from 'recoil';
import GoatToPlace from './GoatToPlace';
import { numGoatsToPlaceState } from './State';

function GoatsToPlace(): JSX.Element {
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);
  return (
    <div className={numGoatsToPlace.toString()}>
      {Range(0, numGoatsToPlace).map((i) => (
        <GoatToPlace key={i} />
      ))}
    </div>
  );
}

export default GoatsToPlace;
