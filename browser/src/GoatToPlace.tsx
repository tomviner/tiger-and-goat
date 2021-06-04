import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './Constants';
import './GoatToPlace.css';

function GoatToPlace(): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.GOAT,
    item: { toPlace: true },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <span className={'goatToPlace'} ref={drag}>
      🐐
    </span>
  );
}

export default GoatToPlace;
