import { Set } from 'immutable';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useRecoilState, useRecoilValue } from 'recoil';
import { postData } from './api';
import { ItemTypes } from './Constants';
import { Move } from './move';
import {
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
  const previousRemoteMove = useRecoilValue(remoteMoveState);

  const canMove = (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => {
    const move = new Move(item.toPlace, item.fromPosNum, toPosNum);
    const correctTurn = itemType === playersTurn.type;
    const targetFree = !tigers.union(goats).includes(toPosNum);
    return correctTurn && targetFree && possibleMoves.includes(move.toList());
  };

  const doMove: (
    itemType: string | symbol | null,
    item: ItemType,
    toPosNum: number,
  ) => void = (itemType, item, toPosNum) => {
    const fromPosNum = item.fromPosNum;
    const move = new Move(item.toPlace, fromPosNum, toPosNum);

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
      remoteMove: null,
    });

    console.log('POST', JSON.stringify({ move: move.toList(), stateOfGame }));
    // request remote response move
    const res = postData(stateOfGame, move.toList());
    // apply remote move
    res.then(setUpdatedGame).catch((error) => {
      console.error(error);
      // error with fetching and applying remote move, revert local move
      setUpdatedGame(updatedGame);
      // move = previousRemoteMove;
    });
    return { move: move.toList() };
  };

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.TIGER, ItemTypes.GOAT],
      canDrop: (item, monitor) =>
        canMove(monitor.getItemType(), item as ItemType, posNum),
      drop: (item, monitor) => doMove(monitor.getItemType(), item as ItemType, posNum),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [posNum, playersTurn, possibleMoves, history],
  );

  const targetClsNames = getClsNames(
    {
      isOver,
      cannotDrop: (isOver && !canDrop) || pieceUnderDrag,
    },
    'target',
  );

  return <div className={targetClsNames} key={posNum} ref={drop} />;
}

export default Target;
