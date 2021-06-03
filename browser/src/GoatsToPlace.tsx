import React from 'react';
import { Range } from 'immutable';
import GoatToPlace from './GoatToPlace';

export interface GoatsToPlaceProps {
  numGoatsToPlace: number;
}

function GoatsToPlace({ numGoatsToPlace }: GoatsToPlaceProps): JSX.Element {
  return (
    <div className={(numGoatsToPlace || 0).toString()}>
      {Range(0, numGoatsToPlace || 0).map((_, i) => (
        <GoatToPlace key={i} />
      ))}
    </div>
  );
}

export default GoatsToPlace;
