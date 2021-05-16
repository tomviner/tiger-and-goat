import React from 'react';
import { range2d, getClsNames, rand } from './utils';

import './board.css';

function Board(): JSX.Element {
  return (
    <div className={'gameBoard'}>
      {range2d(5, 5)
        .toJS()
        .map(([x, y]) => {
          const pos_num = 5 * y + x;

          const visible = x < 4 && y < 4;
          const diagBackward = (x + y) % 2 === 0;

          const boxClsNames = getClsNames(
            {
              visibleBox: visible,
              hiddenBox: !visible,
              diagForward: visible && !diagBackward,
              diagBackward: visible && diagBackward,
            },
            'box',
          );

          let pieceClass = '';
          if (rand(0.3)) {
            if (rand(0.5)) {
              pieceClass = 'tiger';
            } else {
              pieceClass = 'goat';
            }
          }
          const pieceClsNames = getClsNames({}, `${pieceClass} piece`);
          return (
            <div className={boxClsNames} key={pos_num}>
              <div className={pieceClsNames}></div>
            </div>
          );
        })}
    </div>
  );
}

export default Board;
