import React from 'react';
import { Range } from 'immutable';
import GoatToPlace from './GoatToPlace';
import { numGoatsToPlaceState } from './State';
import { useRecoilValue } from 'recoil';

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
