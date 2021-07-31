import React from 'react';
import { useRecoilValue } from 'recoil';
import GoatLastEaten from './GoatLastEaten';
import { numGoatsEatenState } from './State';

function GoatsEaten(): JSX.Element {
  let numGoatsEaten = useRecoilValue(numGoatsEatenState);

  if (numGoatsEaten < 0) {
    console.warn('numGoatsEaten is', numGoatsEaten);
    numGoatsEaten = 0;
  }

  const nonLastNumGoatsEaten = Math.max(0, numGoatsEaten - 1);

  return (
    <>
      <div>Eaten:</div>
      <div className="goatsEatenWrapper">
        <div className="nonLastGoatsEaten">{'🐐'.repeat(nonLastNumGoatsEaten)}</div>
        {numGoatsEaten ? (
          <GoatLastEaten numGoatsEaten={numGoatsEaten} key={numGoatsEaten} />
        ) : null}
      </div>
    </>
  );
}

export default GoatsEaten;
