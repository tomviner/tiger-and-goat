import { Range } from 'immutable';
import React from 'react';
import { useRecoilValue } from 'recoil';
import GoatToPlace from './GoatToPlace';
import { numGoatsEatenState, numGoatsToPlaceState, playersTurnState } from './State';

function GoatsToPlace(): JSX.Element {
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);
  let numGoatsEaten = useRecoilValue(numGoatsEatenState);
  const playersTurn = useRecoilValue(playersTurnState);

  if (numGoatsEaten < 0) {
    console.warn('numGoatsEaten is', numGoatsEaten);
    numGoatsEaten = 0;
  }

  const GoatsToPlace = (
    <div className={numGoatsToPlace.toString()}>
      {Range(0, numGoatsToPlace).map((i) => (
        <GoatToPlace key={i} />
      ))}
    </div>
  );

  return (
    <>
      <div>Turn: {playersTurn.name}</div>
      <div>To place: {GoatsToPlace}</div>
      <div>Eaten: {'🐐'.repeat(numGoatsEaten)}</div>
    </>
  );
}

export default GoatsToPlace;
