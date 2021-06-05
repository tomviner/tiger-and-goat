// Compiled board move graphs using pos nums. See server tests for how these were formed
import { fromJS } from 'immutable';

// Maps a board pos_num to the pos_nums that can be directly stepped to
export const STEPS_GRAPH = fromJS({
  0: [1, 5, 6],
  1: [0, 2, 6],
  2: [1, 3, 7, 8, 6],
  3: [2, 4, 8],
  4: [3, 9, 8],
  5: [6, 0, 10],
  6: [5, 7, 1, 11, 0, 12, 10, 2],
  7: [6, 8, 2, 12],
  8: [7, 9, 3, 13, 12, 4, 2, 14],
  9: [8, 4, 14],
  10: [11, 5, 15, 16, 6],
  11: [10, 12, 6, 16],
  12: [11, 13, 7, 17, 6, 18, 16, 8],
  13: [12, 14, 8, 18],
  14: [13, 9, 19, 8, 18],
  15: [16, 10, 20],
  16: [15, 17, 11, 21, 20, 12, 10, 22],
  17: [16, 18, 12, 22],
  18: [17, 19, 13, 23, 12, 24, 22, 14],
  19: [18, 14, 24],
  20: [21, 15, 16],
  21: [20, 22, 16],
  22: [21, 23, 17, 16, 18],
  23: [22, 24, 18],
  24: [23, 19, 18],
});

// Maps a board pos_num to the pos_nums that a tiger can jump to
export const JUMPS_GRAPH = fromJS({
  0: [2, 10, 12],
  1: [3, 11],
  2: [0, 4, 12, 14, 10],
  3: [1, 13],
  4: [2, 14, 12],
  5: [7, 15],
  6: [8, 16, 18],
  7: [5, 9, 17],
  8: [6, 18, 16],
  9: [7, 19],
  10: [12, 0, 20, 22, 2],
  11: [13, 1, 21],
  12: [10, 14, 2, 22, 0, 24, 20, 4],
  13: [11, 3, 23],
  14: [12, 4, 24, 2, 22],
  15: [17, 5],
  16: [18, 6, 8],
  17: [15, 19, 7],
  18: [16, 8, 6],
  19: [17, 9],
  20: [22, 10, 12],
  21: [23, 11],
  22: [20, 24, 12, 10, 14],
  23: [21, 13],
  24: [22, 14, 12],
});
