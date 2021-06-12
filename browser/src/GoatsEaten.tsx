import React from 'react';
import { useRecoilValue } from 'recoil';
import { numGoatsEatenState } from './State';

function GoatsEaten(): JSX.Element {
  let numGoatsEaten = useRecoilValue(numGoatsEatenState);

  if (numGoatsEaten < 0) {
    console.warn('numGoatsEaten is', numGoatsEaten);
    numGoatsEaten = 0;
  }

  return (
    <>
      <div>Eaten: {'🐐'.repeat(numGoatsEaten)}</div>
    </>
  );
}

export default GoatsEaten;
