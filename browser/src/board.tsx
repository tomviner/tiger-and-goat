import React, { useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Controller, Controllers, OpponentsInfo } from './api';
import './board.css';
import { controllersFromSearch, SideKey, urlForControllers } from './controllerParams';
import Debug from './Debug';
import { fetchOpponents, fetchStart, sendMove } from './gameSource';
import GoatsEaten from './GoatsEaten';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  controllersState,
  engineModeState,
  moveLogState,
  playersTurnState,
  resultState,
  stateOfGameState,
  updatedGameState,
} from './State';
import { range2d } from './utils';

// Piece moves transition for 1s. Leave a little paint margin before another
// automatic turn updates the board; two plies also outlast the 2s capture
// transition, so a following tiger capture cannot replace it early.
const AUTO_MOVE_DELAY_MS = 1200;

function Board(): JSX.Element {
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const playersTurn = useRecoilValue(playersTurnState);
  const result = useRecoilValue(resultState);
  const [controllers, setControllers] = useRecoilState(controllersState);
  const [opponents, setOpponents] = useState<OpponentsInfo | null>(null);
  const [mode, setMode] = useRecoilState(engineModeState);
  const setMoveLog = useSetRecoilState(moveLogState);
  const [moveError, setMoveError] = useState('');
  const urlPresetApplied = useRef(false);

  // (Re)start a game whenever the engine mode changes.
  const newGame = () => {
    setMoveError('');
    setMoveLog([]);
    fetchStart(mode).then(setUpdatedGame).catch(console.error);
  };

  useEffect(() => {
    newGame();
    fetchOpponents(mode).then(setOpponents).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!opponents || urlPresetApplied.current) return;
    urlPresetApplied.current = true;
    const params = new URLSearchParams(window.location.search);
    if (!['both', 'goat', 'tiger'].some((name) => params.has(name))) return;
    setControllers((current) =>
      controllersFromSearch(window.location.search, current, opponents),
    );
  }, [opponents, setControllers]);

  // Auto-advance: whenever the side to move is engine-controlled (AI or a
  // strategy), ask the engine for its move. This drives human-vs-engine,
  // engine-vs-engine, and strategy-vs-strategy alike, and stops at game over.
  const turnSide: SideKey = playersTurn.playerNum === 1 ? 'goat' : 'tiger';
  const engineToMove = controllers[turnSide].type !== 'human';

  useEffect(() => {
    if (!engineToMove || result || !stateOfGame.history.size) {
      return;
    }
    const timer = setTimeout(() => {
      setMoveError('');
      sendMove(mode, stateOfGame, null, controllers)
        .then((updated) => {
          const remoteMove = updated.remoteMove;
          if (remoteMove) {
            setMoveLog((log) => [...log, remoteMove.toArray()]);
          }
          setUpdatedGame(updated);
        })
        .catch((error) => {
          console.error(error);
          setMoveError(error instanceof Error ? error.message : 'The AI move failed');
        });
    }, AUTO_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineToMove, result, stateOfGame, controllers, mode]);

  const depthOptions = opponents
    ? Array.from(
        { length: opponents.depth.max - opponents.depth.min + 1 },
        (_, i) => opponents.depth.min + i,
      )
    : [];

  const usesJev = controllers.goat.type === 'jev' || controllers.tiger.type === 'jev';

  const setControllersAndUrl = (next: Controllers) => {
    setControllers(next);
    window.history.replaceState(
      window.history.state,
      '',
      urlForControllers(window.location.href, next),
    );
  };

  const setController = (side: SideKey, controller: Controller) =>
    setControllersAndUrl({ ...controllers, [side]: controller });

  // Swap the two sides' controllers. A strategy is side-specific, so if one
  // lands on the wrong side it falls back to the AI.
  const swapSides = () => {
    const onSide = (controller: Controller, side: SideKey): Controller => {
      if (controller.type === 'strategy') {
        const valid = (opponents?.strategies ?? []).some(
          (s) => s.sideName === side && s.name === controller.name,
        );
        if (!valid) {
          return { type: 'ai', depth: opponents?.depth.default ?? 6 };
        }
      }
      return controller;
    };
    setControllersAndUrl({
      goat: onSide(controllers.tiger, 'goat'),
      tiger: onSide(controllers.goat, 'tiger'),
    });
  };

  const renderSide = (side: SideKey, label: string) => {
    const controller = controllers[side];
    const strategies = (opponents?.strategies ?? []).filter((s) => s.sideName === side);
    const value =
      controller.type === 'human'
        ? 'human'
        : controller.type === 'ai'
          ? 'ai'
          : controller.type === 'jev'
            ? 'jev'
            : controller.name;

    const onSelect = (selected: string) => {
      if (selected === 'human') {
        setController(side, { type: 'human' });
      } else if (selected === 'ai') {
        setController(side, { type: 'ai', depth: opponents?.depth.default ?? 6 });
      } else if (selected === 'jev') {
        setController(side, { type: 'jev' });
      } else {
        setController(side, { type: 'strategy', name: selected });
      }
    };

    return (
      <label className="sidePicker">
        {label}:{' '}
        <select value={value} onChange={(e) => onSelect(e.target.value)}>
          <option value="human">Human</option>
          <option value="ai">AI (Negamax)</option>
          <option value="jev">Jev (Cloudflare)</option>
          {strategies.map((s) => (
            <option key={s.name} value={s.name} title={s.description}>
              {s.name}
            </option>
          ))}
        </select>
        {controller.type === 'ai' && depthOptions.length > 0 && (
          <>
            {' '}
            depth{' '}
            <select
              aria-label={`${label} AI depth`}
              value={controller.depth}
              onChange={(e) =>
                setController(side, { type: 'ai', depth: Number(e.target.value) })
              }
            >
              {depthOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </>
        )}
      </label>
    );
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="result">{result}</div>
        {moveError ? (
          <div className="moveError" role="alert">
            {moveError}
          </div>
        ) : null}
        <div className="controls">
          {renderSide('goat', 'Goat')}
          <button className="swapButton" onClick={swapSides} title="Swap sides">
            ⇄
          </button>
          {renderSide('tiger', 'Tiger')}
        </div>
        <div className="controls">
          Turn: <b>{playersTurn.name}</b>
          <label className="sidePicker">
            Rules engine:{' '}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="server">Python server (game rules)</option>
              <option value="local">Browser (game rules)</option>
            </select>
          </label>
          {usesJev ? (
            <span>
              Jev AI: <b>Cloudflare</b>
            </span>
          ) : null}
        </div>
        <GoatsToPlace />
        <div className="boardArea">
          <div className={'gameBoard'}>
            <div className="fileLabels">
              {['A', 'B', 'C', 'D', 'E'].map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
            <div className="rankLabels">
              {[1, 2, 3, 4, 5].map((r) => (
                <span key={r}>{r}</span>
              ))}
            </div>
            {range2d(5, 5)
              .toJS()
              .map(([x, y]) => {
                return <Square key={`${x},${y}`} x={x} y={y} />;
              })}
          </div>
          {result ? (
            <div className="gameOverOverlay">
              <div className="gameOverText">{result}</div>
              <button className="newGameButton" onClick={newGame}>
                New game
              </button>
            </div>
          ) : null}
        </div>
      </DndProvider>
      <GoatsEaten />
      <Debug />
    </>
  );
}

export default Board;
