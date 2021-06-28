// Compiled board move graphs using pos nums. See server tests for how these were formed
import { List, Map, Set } from 'immutable';

// Maps a board posNum to the posNums that can be directly stepped to
export const STEPS_GRAPH = Map<number, Set<number>>(
  List.of(
    [0, Set.of(1, 5, 6)],
    [1, Set.of(0, 2, 6)],
    [2, Set.of(1, 3, 7, 8, 6)],
    [3, Set.of(2, 4, 8)],
    [4, Set.of(3, 9, 8)],
    [5, Set.of(6, 0, 10)],
    [6, Set.of(5, 7, 1, 11, 0, 12, 10, 2)],
    [7, Set.of(6, 8, 2, 12)],
    [8, Set.of(7, 9, 3, 13, 12, 4, 2, 14)],
    [9, Set.of(8, 4, 14)],
    [10, Set.of(11, 5, 15, 16, 6)],
    [11, Set.of(10, 12, 6, 16)],
    [12, Set.of(11, 13, 7, 17, 6, 18, 16, 8)],
    [13, Set.of(12, 14, 8, 18)],
    [14, Set.of(13, 9, 19, 8, 18)],
    [15, Set.of(16, 10, 20)],
    [16, Set.of(15, 17, 11, 21, 20, 12, 10, 22)],
    [17, Set.of(16, 18, 12, 22)],
    [18, Set.of(17, 19, 13, 23, 12, 24, 22, 14)],
    [19, Set.of(18, 14, 24)],
    [20, Set.of(21, 15, 16)],
    [21, Set.of(20, 22, 16)],
    [22, Set.of(21, 23, 17, 16, 18)],
    [23, Set.of(22, 24, 18)],
    [24, Set.of(23, 19, 18)],
  ),
);

// Maps a board posNum to the posNums that a tiger can jump to
export const JUMPS_GRAPH = Map<number, Set<number>>(
  List.of(
    [0, Set.of(2, 10, 12)],
    [1, Set.of(3, 11)],
    [2, Set.of(0, 4, 12, 14, 10)],
    [3, Set.of(1, 13)],
    [4, Set.of(2, 14, 12)],
    [5, Set.of(7, 15)],
    [6, Set.of(8, 16, 18)],
    [7, Set.of(5, 9, 17)],
    [8, Set.of(6, 18, 16)],
    [9, Set.of(7, 19)],
    [10, Set.of(12, 0, 20, 22, 2)],
    [11, Set.of(13, 1, 21)],
    [12, Set.of(10, 14, 2, 22, 0, 24, 20, 4)],
    [13, Set.of(11, 3, 23)],
    [14, Set.of(12, 4, 24, 2, 22)],
    [15, Set.of(17, 5)],
    [16, Set.of(18, 6, 8)],
    [17, Set.of(15, 19, 7)],
    [18, Set.of(16, 8, 6)],
    [19, Set.of(17, 9)],
    [20, Set.of(22, 10, 12)],
    [21, Set.of(23, 11)],
    [22, Set.of(20, 24, 12, 10, 14)],
    [23, Set.of(21, 13)],
    [24, Set.of(22, 14, 12)],
  ),
);
