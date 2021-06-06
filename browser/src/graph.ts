// Compiled board move graphs using pos nums. See server tests for how these were formed
import { List, Map } from 'immutable';

// Maps a board pos_num to the pos_nums that can be directly stepped to
export const STEPS_GRAPH = Map<number, List<number>>(
  List.of(
    [0, List.of(1, 5, 6)],
    [1, List.of(0, 2, 6)],
    [2, List.of(1, 3, 7, 8, 6)],
    [3, List.of(2, 4, 8)],
    [4, List.of(3, 9, 8)],
    [5, List.of(6, 0, 10)],
    [6, List.of(5, 7, 1, 11, 0, 12, 10, 2)],
    [7, List.of(6, 8, 2, 12)],
    [8, List.of(7, 9, 3, 13, 12, 4, 2, 14)],
    [9, List.of(8, 4, 14)],
    [10, List.of(11, 5, 15, 16, 6)],
    [11, List.of(10, 12, 6, 16)],
    [12, List.of(11, 13, 7, 17, 6, 18, 16, 8)],
    [13, List.of(12, 14, 8, 18)],
    [14, List.of(13, 9, 19, 8, 18)],
    [15, List.of(16, 10, 20)],
    [16, List.of(15, 17, 11, 21, 20, 12, 10, 22)],
    [17, List.of(16, 18, 12, 22)],
    [18, List.of(17, 19, 13, 23, 12, 24, 22, 14)],
    [19, List.of(18, 14, 24)],
    [20, List.of(21, 15, 16)],
    [21, List.of(20, 22, 16)],
    [22, List.of(21, 23, 17, 16, 18)],
    [23, List.of(22, 24, 18)],
    [24, List.of(23, 19, 18)],
  ),
);

// Maps a board pos_num to the pos_nums that a tiger can jump to
export const JUMPS_GRAPH = Map<number, List<number>>(
  List.of(
    [0, List.of(2, 10, 12)],
    [1, List.of(3, 11)],
    [2, List.of(0, 4, 12, 14, 10)],
    [3, List.of(1, 13)],
    [4, List.of(2, 14, 12)],
    [5, List.of(7, 15)],
    [6, List.of(8, 16, 18)],
    [7, List.of(5, 9, 17)],
    [8, List.of(6, 18, 16)],
    [9, List.of(7, 19)],
    [10, List.of(12, 0, 20, 22, 2)],
    [11, List.of(13, 1, 21)],
    [12, List.of(10, 14, 2, 22, 0, 24, 20, 4)],
    [13, List.of(11, 3, 23)],
    [14, List.of(12, 4, 24, 2, 22)],
    [15, List.of(17, 5)],
    [16, List.of(18, 6, 8)],
    [17, List.of(15, 19, 7)],
    [18, List.of(16, 8, 6)],
    [19, List.of(17, 9)],
    [20, List.of(22, 10, 12)],
    [21, List.of(23, 11)],
    [22, List.of(20, 24, 12, 10, 14)],
    [23, List.of(21, 13)],
    [24, List.of(22, 14, 12)],
  ),
);
