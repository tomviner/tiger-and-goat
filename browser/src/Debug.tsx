import { List, Set } from 'immutable';
import React, { useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import './Debug.css';
import { describeState } from './gameSource';
import { moveToNotation, posToNotation } from './notation';
import {
  historyState,
  numGoatsToPlaceState,
  playerNumState,
  possibleMovesState,
  stateOfGameState,
  updatedGameState,
} from './State';

function notatePieces(set: Set<number>): string {
  return set
    .toArray()
    .sort((a, b) => a - b)
    .map(posToNotation)
    .join(' ');
}

function Debug(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [loadText, setLoadText] = useState('');
  const [loadError, setLoadError] = useState('');

  const stateOfGame = useRecoilValue(stateOfGameState);
  const possibleMoves = useRecoilValue(possibleMovesState);
  const history = useRecoilValue(historyState);
  const playerNum = useRecoilValue(playerNumState);
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);
  const setUpdatedGame = useSetRecoilState(updatedGameState);

  const stateJson = JSON.stringify({
    playerNum,
    numGoatsToPlace,
    history: stateOfGame.history.toJS(),
  });

  const legalMoves = possibleMoves
    .toArray()
    .map((m: List<number>) => moveToNotation(m.toArray()))
    .sort();

  const load = () => {
    try {
      const parsed = JSON.parse(loadText);
      setUpdatedGame(describeState(parsed));
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

      <h4>Board history (oldest → newest)</h4>
      <ol className="debugHistory">
        {history.toArray().map((pos, i) => (
          <li key={i}>
            🐅 {notatePieces(pos.get(0, Set<number>()))} &nbsp;|&nbsp; 🐐{' '}
            {notatePieces(pos.get(1, Set<number>()))}
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
