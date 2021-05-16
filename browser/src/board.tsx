import React from 'react';
import { range2d, getClsNames, rand } from './utils.js';

import './board.css';

function Board() {

  return (
    <div className={"gameBoard"}>
      {
        range2d(5, 5).toJS().map(([x, y]) => {
          const visible = x < 4 && y < 4;

          const boxClsNames = getClsNames({
            visibleBox: visible,
            diagForward: (visible && ((x + y) % 2)),
            diagBackward: (visible && !((x + y) % 2)),
          }, "box");

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
            <div className={boxClsNames}>
              <div className={pieceClsNames}></div>
            </div>
          )
        })
      }
    </div>
  );
}

export default Board;
