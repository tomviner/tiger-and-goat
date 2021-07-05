import { List, Set } from 'immutable';
import { ItemTypes } from './Constants';
import { JUMPS_GRAPH, STEPS_GRAPH } from './graph';
import { average } from './utils';

export const getMove = (
  toPlace: boolean,
  fromPosNum: number,
  toPosNum: number,
): List<number> => {
  if (toPlace) {
    return List([toPosNum]);
  }
  const canStepTo = STEPS_GRAPH.get(fromPosNum);
  if (canStepTo && canStepTo.includes(toPosNum)) {
    return List([fromPosNum, toPosNum]);
  }

  const canJumpTo = JUMPS_GRAPH.get(fromPosNum);
  if (canJumpTo && canJumpTo.includes(toPosNum)) {
    const eaten = average(fromPosNum, toPosNum);
    return List([fromPosNum, eaten, toPosNum]);
  }
  return List();
};

enum MoveType {
  PLACE = 1,
  STEP,
  JUMP,
}

export class Move {
  toPlace: boolean | unknown;
  fromPosNum: number;
  eaten = -1;
  toPosNum: number;
  moveType: MoveType = MoveType.PLACE;

  constructor(toPlace: boolean, fromPosNum: number, toPosNum: number) {
    this.fromPosNum = fromPosNum;
    this.toPosNum = toPosNum;

    if (toPlace) {
      this.moveType = MoveType.PLACE;
    } else {
      const canStepTo = STEPS_GRAPH.get(this.fromPosNum);
      if (canStepTo && canStepTo.includes(this.toPosNum)) {
        this.moveType = MoveType.STEP;
      }
      const canJumpTo = JUMPS_GRAPH.get(this.fromPosNum);
      if (canJumpTo && canJumpTo.includes(this.toPosNum)) {
        this.moveType = MoveType.JUMP;
        this.eaten = average(this.fromPosNum, this.toPosNum);
      }
    }
  }

  toList(): List<number> {
    if (this.moveType === MoveType.PLACE) {
      return List([this.toPosNum]);
    } else if (this.moveType === MoveType.STEP) {
      return List([this.fromPosNum, this.toPosNum]);
    } else {
      return List([this.fromPosNum, this.eaten, this.toPosNum]);
    }
  }

  apply(
    tigers: Set<number>,
    goats: Set<number>,
    itemType: string | symbol | null,
  ): List<Set<number>> {
    if (this.moveType === MoveType.PLACE) {
      return List.of(tigers, goats.add(this.toPosNum));
    } else if (this.moveType === MoveType.STEP) {
      if (itemType === ItemTypes.TIGER) {
        return List.of(tigers.remove(this.fromPosNum).add(this.toPosNum), goats);
      } else {
        return List.of(tigers, goats.remove(this.fromPosNum).add(this.toPosNum));
      }
    } else {
      return List.of(
        tigers.remove(this.fromPosNum).add(this.toPosNum),
        goats.remove(this.eaten),
      );
    }
  }
}
