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

export class Move {
  toPlace: boolean;
  fromPosNum: number | null;
  eaten: number | null = null;
  toPosNum: number;

  constructor(toPlace: boolean, fromPosNum: number, toPosNum: number) {
    this.toPlace = toPlace;
    this.fromPosNum = fromPosNum;
    this.toPosNum = toPosNum;

    if (!toPlace) {
      const canJumpTo = JUMPS_GRAPH.get(this.fromPosNum);
      if (canJumpTo && canJumpTo.includes(this.toPosNum)) {
        this.eaten = average(this.fromPosNum, this.toPosNum);
      }
      const canStepTo = STEPS_GRAPH.get(this.fromPosNum);
      if (!(canStepTo && canStepTo.includes(this.toPosNum))) {
        throw new Error('Move not allowed');
      }
    }
  }

  toList(): List<number> {
    if (this.fromPosNum === null) {
      return List([this.toPosNum]);
    } else if (this.eaten === null) {
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
    if (this.fromPosNum === null) {
      return List.of(tigers, goats.add(this.toPosNum));
    } else if (this.eaten === null) {
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
