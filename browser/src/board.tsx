import React from 'react';

import './board.css';

function Board() {

  return (
    <div className={"gameBoard"}>
      <div className={"box diagBackward"}>
        <div className={"piece tiger"}></div>
      </div>
      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}></div>
      <div className={"box diagForward"}></div>
      <div className={"hiddenBox"}>
        <div className={"piece tiger"}></div>
      </div>

      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}></div>
      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}></div>
      <div className={"hiddenBox"}>
        <div className={"piece goat"}></div>
      </div>

      <div className={"box diagBackward"}></div>
      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}>
        <div className={"piece goat"}></div>
      </div>
      <div className={"box diagForward"}></div>
      <div className={"hiddenBox"}></div>

      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}>
        <div className={"piece goat"}></div>
      </div>
      <div className={"box diagForward"}></div>
      <div className={"box diagBackward"}></div>
      <div className={"hiddenBox"}></div>

      <div className={"hiddenBox"}>
        <div className={"piece tiger"}></div>
      </div>
      <div className={"hiddenBox"}></div>
      <div className={"hiddenBox"}></div>
      <div className={"hiddenBox"}></div>
      <div className={"hiddenBox"}>
        <div className={"piece tiger"}></div>
      </div>
    </div>
  );
}

export default Board;
