import { List } from 'immutable';
import React, { useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import './Debug.css';
import { describeState } from './gameSource';
import { moveToNotation, movesFromHistory } from './notation';
import {
  moveLogState,
  numGoatsToPlaceState,
  playerNumState,
  possibleMovesState,
  stateOfGameState,
  updatedGameState,
} from './State';

function Debug(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [loadText, setLoadText] = useState('');
  const [loadError, setLoadError] = useState('');

  const stateOfGame = useRecoilValue(stateOfGameState);
  const possibleMoves = useRecoilValue(possibleMovesState);
  const playerNum = useRecoilValue(playerNumState);
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);
  const moveLog = useRecoilValue(moveLogState);
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const setMoveLog = useSetRecoilState(moveLogState);

  const stateJson = JSON.stringify({
    playerNum,
    numGoatsToPlace,
    history: stateOfGame.history.toJS(),
  });

  const legalMoves = possibleMoves
    .toArray()
    .map((m: List<number>) => moveToNotation(m.toArray()))
    .sort();

  // Goat moves first, then alternating, so pair them into numbered turns.
  const turns: number[][][] = [];
  for (let i = 0; i < moveLog.length; i += 2) {
    turns.push([moveLog[i], moveLog[i + 1]]);
  }

  const load = () => {
    try {
      const parsed = JSON.parse(loadText);
      setUpdatedGame(describeState(parsed));
      setMoveLog(movesFromHistory(parsed.history));
      setLoadError('');
    } catch (e) {
      setLoadError(String(e));
    }
  };

  if (!open) {
    return (
      <button className="debugToggle" onClick={() => setOpen(true)}>
        Debug ▸
      </button>
    );
  }

  return (
    <div className="debug">
      <button className="debugToggle" onClick={() => setOpen(false)}>
        Debug ▾
      </button>

      <h4>Moves ({moveLog.length})</h4>
      <ol className="debugMoveList">
        {turns.map(([goat, tiger], i) => (
          <li key={i}>
            <span className="goatMove">{moveToNotation(goat)}</span>
            {tiger ? <span className="tigerMove">{moveToNotation(tiger)}</span> : null}
          </li>
        ))}
      </ol>

      <h4>Legal moves now ({legalMoves.length})</h4>
      <div className="debugMoves">{legalMoves.join(', ') || '— none —'}</div>

      <h4>State (copy to reproduce)</h4>
      <textarea className="debugState" readOnly rows={3} value={stateJson} />
      <button onClick={() => navigator.clipboard.writeText(stateJson)}>Copy</button>

      <h4>Load a state</h4>
      <textarea
        className="debugState"
        rows={3}
        placeholder="paste a state JSON here"
        value={loadText}
        onChange={(e) => setLoadText(e.target.value)}
      />
      <button onClick={load}>Load</button>
      {loadError ? <div className="debugError">{loadError}</div> : null}
    </div>
  );
}

export default Debug;
