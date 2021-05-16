import { List, Map, Range } from 'immutable';

export const range2d: (a: number, b: number) => List<List<number>> = (a, b) =>
  // returns an Array of List pairs.

  // flat map concats the inner arrays, so we get each row's coords
  // directly after the last, in the same outer Array
  Range(0, a)
    .flatMap((_, x) =>
      // this is an array of coords
      Range(0, b).map((_, y) => List([x, y])),
    )
    .toList();

export const rand: (chance: number) => boolean = (chance) => Math.random() < chance;

export const sum: (nums: number[]) => number = (nums) =>
  nums.reduce((a, b) => a + b, 0);

type nameBoolMapType = {
  [key: string]: boolean;
};

export const getClsNames: (namedBools: nameBoolMapType, staticNames: string) => string =
  (namedBools, staticNames = '') => {
    const conditionalNames = Object.keys(namedBools).filter((name) => namedBools[name]);
    return `${staticNames} ${conditionalNames.join(' ')}`.trim();
  };

export const mapToFunction: <T, F>(seq: List<T>, func: (x: T) => F) => Map<T, F> = (
  seq,
  func,
) => Map(seq.map((x) => [x, func(x)]));

export const mapToValue: <T, V>(seq: List<T>, value: V) => Map<T, V> = (seq, value) =>
  Map(seq.map((x) => [x, value]));
