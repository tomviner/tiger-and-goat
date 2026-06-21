import { Set } from 'immutable';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ItemTypes } from './Constants';
import { sendMove } from './gameSource';
import { Move } from './move';
import {
  controllersState,
  engineModeState,
  goatsState,
  historyState,
  numGoatsToPlaceState,
  playersTurnState,
  possibleMovesState,
  remoteMoveState,
  stateOfGameState,
  tigersState,
  updatedGameState,
} from './State';
import './Target.css';
import { getClsNames } from './utils';

export interface TargetProps {
  posNum: number;
  pieceUnderDrag: boolean;
}

export interface ItemType {
  toPlace: boolean;
  fromPosNum: number;
}

function Target({ posNum, pieceUnderDrag }: TargetProps): JSX.Element {
  const playersTurn = useRecoilValue(playersTurnState);
  const tigers = useRecoilValue(tigersState);
  const goats = useRecoilValue(goatsState);
  const [updatedGame, setUpdatedGame] = useRecoilState(updatedGameState);
  const possibleMoves = useRecoilValue(possibleMovesState);
  const stateOfGame = useRecoilValue(stateOfGameState);
  const history = useRecoilValue(historyState);
  const numGoatsToPlace = useRecoilValue(numGoatsToPlaceState);
  const [previousRemoteMove, setPreviousRemoteMove] = useRecoilState(remoteMoveState);
  const controllers = useRecoilValue(controllersState);
  const mode = useRecoilValue(engineModeState);
  const turnSide = playersTurn.playerNum === 1 ? 'goat' : 'tiger';
  const humanToMove = controllers[turnSide].type === 'human';

  const canMove = (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => {
    let move;
    try {
      move = new Move(item.toPlace, item.fromPosNum, toPosNum);
    } catch {
      return false;
    }
    const correctTurn = itemType === playersTurn.type;
    const targetFree = !tigers.union(goats).includes(toPosNum);
    return (
      humanToMove && correctTurn && targetFree && possibleMoves.includes(move.toList())
    );
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => void = (itemType, item, toPosNum) => {
    const fromPosNum = item.fromPosNum;
    const move = new Move(item.toPlace, fromPosNum, toPosNum);

    // this doesn't work, as it gets overridden below
    if (move?.eaten) {
      setPreviousRemoteMove(move.toList());
    }

    const newPlayerNum = playersTurn.otherPlayerNum;
    const newNumGoatsToPlace = item.toPlace ? numGoatsToPlace - 1 : numGoatsToPlace;

    const newPieces = move.apply(tigers, goats, itemType);

    const newHistory = history.push(newPieces);
    // apply local move
    setUpdatedGame({
      playerNum: newPlayerNum,
      numGoatsToPlace: newNumGoatsToPlace,
      history: newHistory,
      possibleMoves: Set(),
      result: '',
      remoteMove: previousRemoteMove,
    });

    // request remote response move
    const res = sendMove(mode, stateOfGame, move.toList(), controllers);
    // apply remote move
    res.then(setUpdatedGame).catch((error) => {
      console.error(error);
      // error with fetching and applying remote move, revert local move
      setUpdatedGame(updatedGame);
    });
  };

  const [{ isOver, canDrop, isUnderSelf }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: (item, monitor) =>
        canMove(monitor.getItemType(), item as ItemType, posNum),
      drop: (item, monitor) => doMove(monitor.getItemType(), item as ItemType, posNum),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        isUnderSelf: (monitor.getItem() as ItemType)?.fromPosNum == posNum,
      }),
    }),
    // controllers and mode must be here: the drop handler reads them (e.g.
    // whether the side to move is Human), and they can change between moves.
    [posNum, playersTurn, history, controllers, mode],
  );

  const targetClsNames = getClsNames(
    {
      isOver,
      cannotDrop: (isOver && !canDrop) || pieceUnderDrag,
      isUnderSelf,
    },
    'target',
  );

  return <div className={targetClsNames} key={`TD${posNum}`} ref={drop} />;
}

export default Target;
