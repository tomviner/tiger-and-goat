import { List } from 'immutable';
import { mockRandomForEach } from 'jest-mock-random';
import { getClsNames, rand, range2d, sum } from './utils';

describe('2d range', () => {
  test('returns all coord pairs', () => {
    expect(range2d(2, 3)).toEqual(
      List([
        List([0, 0]),
        List([1, 0]),
        List([2, 0]),
        List([0, 1]),
        List([1, 1]),
        List([2, 1]),
      ]),
    );
  });
});

describe('sum', () => {
  test('returns sums of numbers in array', () => {
    expect(sum([1, 2, 3, -10])).toEqual(-4);
  });
});

describe('rand', () => {
  test('returns certain chance as true', () => {
    expect(rand(1)).toEqual(true);
  });

  describe('non-int chances that come true', () => {
    mockRandomForEach([0.1, 0.5, 0.9]);
    test('compares accurately', () => {
      expect(rand(0.9)).toEqual(true);
    });
  });

  describe('non-int chances that come false', () => {
    mockRandomForEach([0.1, 0.5, 0.9]);
    test('compares accurately', () => {
      expect(rand(0.09)).toEqual(false);
    });
  });

  test('returns hopeless chance as false', () => {
    expect(rand(0)).toEqual(false);
  });
});

describe('getClsNames', () => {
  test('filters by value', () => {
    const trueName = true;
    const falseName = false;
    expect(getClsNames({ trueName, falseName })).toEqual('trueName');
  });

  test('returns static names too', () => {
    expect(getClsNames({ dyn: true }, 'static other')).toEqual('static other dyn');
  });
});
