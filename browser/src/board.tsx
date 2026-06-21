import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Controller, OpponentsInfo } from './api';
import './board.css';
import { fetchOpponents, fetchStart, sendMove } from './gameSource';
import GoatsEaten from './GoatsEaten';
import GoatsToPlace from './GoatsToPlace';
import Square from './Square';
import {
  controllersState,
  engineModeState,
  playersTurnState,
  resultState,
  stateOfGameState,
  updatedGameState,
} from './State';
import { range2d } from './utils';

type SideKey = 'goat' | 'tiger';

function Board(): JSX.Element {
  const setUpdatedGame = useSetRecoilState(updatedGameState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const playersTurn = useRecoilValue(playersTurnState);
  const result = useRecoilValue(resultState);
  const [controllers, setControllers] = useRecoilState(controllersState);
  const [opponents, setOpponents] = useState<OpponentsInfo | null>(null);
  const [mode, setMode] = useRecoilState(engineModeState);

  // (Re)start a game whenever the engine mode changes.
  useEffect(() => {
    fetchStart(mode).then(setUpdatedGame).catch(console.error);
    fetchOpponents(mode).then(setOpponents).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
      sendMove(mode, stateOfGame, null, controllers)
        .then(setUpdatedGame)
        .catch(console.error);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineToMove, result, stateOfGame, controllers, mode]);

  const depthOptions = opponents
    ? Array.from(
        { length: opponents.depth.max - opponents.depth.min + 1 },
        (_, i) => opponents.depth.min + i,
      )
    : [];

  const setController = (side: SideKey, controller: Controller) =>
    setControllers({ ...controllers, [side]: controller });

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
    setControllers({
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
          : controller.name;

    const onSelect = (selected: string) => {
      if (selected === 'human') {
        setController(side, { type: 'human' });
      } else if (selected === 'ai') {
        setController(side, { type: 'ai', depth: opponents?.depth.default ?? 6 });
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
            Engine:{' '}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="server">Server (Python)</option>
              <option value="local">Local (in-browser)</option>
            </select>
          </label>
        </div>
        <GoatsToPlace />
        <div className="boardArea">
          <div className={'gameBoard'}>
            {range2d(5, 5)
              .toJS()
              .map(([x, y]) => {
                return <Square key={`${x},${y}`} x={x} y={y} />;
              })}
          </div>
        </div>
      </DndProvider>
      <GoatsEaten />
    </>
  );
}

export default Board;
