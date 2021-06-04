import React from 'react';

import { ItemTypes } from './Constants';
import { useDrag } from 'react-dnd';

function GoatToPlace(): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.GOAT,
    item: { toPlace: true },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return <span ref={drag}>🐐</span>;
}

export default GoatToPlace;
