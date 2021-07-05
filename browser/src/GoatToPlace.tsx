import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './Constants';
import './GoatToPlace.css';
import { getClsNames } from './utils';

function GoatToPlace(): JSX.Element {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.GOAT,
    item: { toPlace: true, fromPosNum: null },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const clsNames = getClsNames({ isDragging }, 'goatToPlace');

  return (
    <span className={clsNames} ref={drag}>
      🐐
    </span>
  );
}

export default GoatToPlace;
