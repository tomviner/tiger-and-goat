import { Range } from 'immutable';
import React from 'react';
import { useRecoilValue } from 'recoil';
import GoatToPlace from './GoatToPlace';
import { numGoatsToPlaceState } from './State';

function GoatsToPlace(): JSX.Element {
  // console.log('render GoatsToPlace');
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);

  const GoatsToPlace = (
    <div className={numGoatsToPlace.toString()}>
      {Range(0, numGoatsToPlace).map((i) => (
        <GoatToPlace key={i} />
      ))}
    </div>
  );

  return (
    <>
      <div>To place: {GoatsToPlace}</div>
    </>
  );
}

export default GoatsToPlace;
