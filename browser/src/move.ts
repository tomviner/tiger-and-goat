import { List, Set } from 'immutable';
import { ItemTypes } from './Constants';
import { JUMPS_GRAPH, STEPS_GRAPH } from './graph';
import { average } from './utils';

export class Move {
  toPlace: boolean;
  fromPosNum: number | null;
  eaten: number | null;
  toPosNum: number;

  toJS(): Record<string, unknown> {
    return {
      toPlace: this.toPlace,
      fromPosNum: this.fromPosNum,
      eaten: this.eaten,
      toPosNum: this.toPosNum,
    };
  }

  static fromList(list: List<number | null>): Move {
    let [fromPos, eaten, toPos] = list.toJS();

    // 1 el --> place
    const toPlace = eaten === undefined;
    if (toPlace) {
      toPos = fromPos;
      fromPos = null;
    }
    // 2 els --> step
    if (!toPlace && toPos === undefined) {
      toPos = eaten;
      eaten = null;
    }
    // 3 els --> jump
    // fromPos = fromPos;
    return new Move(toPlace, fromPos, toPos);
  }

  constructor(toPlace: boolean, fromPosNum: number, toPosNum: number) {
    this.toPlace = toPlace;
    this.fromPosNum = fromPosNum;
    this.toPosNum = toPosNum;
    this.eaten = null;

    if (!toPlace) {
      const canStepTo = STEPS_GRAPH.get(this.fromPosNum);
      const canJumpTo = JUMPS_GRAPH.get(this.fromPosNum);
      if (canJumpTo?.includes(this.toPosNum)) {
        this.eaten = average(this.fromPosNum, this.toPosNum);
      } else if (!canStepTo || !canStepTo.includes(this.toPosNum)) {
        throw 'InvalidMove';
      }
    }
    // console.log('mid', this.toJS());
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
