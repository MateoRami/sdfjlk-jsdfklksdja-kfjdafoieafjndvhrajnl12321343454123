export function generateSudoku(): number[][] {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  fillBoard(board);
  return board;
}

function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle numbers
        for (let i = numbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let j = 0; j < 9; j++) {
    if (board[row][j] === num) return false;
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  
  return true;
}

export function solveSudoku(board: number[][]): boolean {
  return fillBoard(board);
}

export function isValidMove(board: number[][], row: number, col: number, num: number): boolean {
  return isValidPlacement(board, row, col, num);
}

export function isCompleted(board: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  return true;
}

export function getProgress(board: number[][]): { completed: number; total: number } {
  let completed = 0;
  const total = 81;
  
  if (!board || board.length === 0) {
    return { completed: 0, total };
  }
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i] && board[i][j] !== 0) completed++;
    }
  }
  
  return { completed, total };
}

// Check if a row is complete and valid
export function isRowComplete(board: number[][], row: number): boolean {
  if (!board[row]) return false;
  
  const seen = new Set<number>();
  for (let col = 0; col < 9; col++) {
    const value = board[row][col];
    if (value === 0) return false;
    if (seen.has(value)) return false;
    seen.add(value);
  }
  return seen.size === 9;
}

// Check if a column is complete and valid
export function isColumnComplete(board: number[][], col: number): boolean {
  const seen = new Set<number>();
  for (let row = 0; row < 9; row++) {
    if (!board[row]) return false;
    const value = board[row][col];
    if (value === 0) return false;
    if (seen.has(value)) return false;
    seen.add(value);
  }
  return seen.size === 9;
}

// Check if a 3x3 block is complete and valid
export function isBlockComplete(board: number[][], blockRow: number, blockCol: number): boolean {
  const seen = new Set<number>();
  const startRow = blockRow * 3;
  const startCol = blockCol * 3;
  
  for (let row = startRow; row < startRow + 3; row++) {
    for (let col = startCol; col < startCol + 3; col++) {
      if (!board[row]) return false;
      const value = board[row][col];
      if (value === 0) return false;
      if (seen.has(value)) return false;
      seen.add(value);
    }
  }
  return seen.size === 9;
}

// Get all cells that should be auto-locked due to completed units
export function getAutoLockCells(board: number[][], currentLocked: boolean[][]): boolean[][] {
  const newLocked = currentLocked.map(row => [...row]);
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    if (isRowComplete(board, row)) {
      for (let col = 0; col < 9; col++) {
        newLocked[row][col] = true;
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    if (isColumnComplete(board, col)) {
      for (let row = 0; row < 9; row++) {
        newLocked[row][col] = true;
      }
    }
  }
  
  // Check 3x3 blocks
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      if (isBlockComplete(board, blockRow, blockCol)) {
        const startRow = blockRow * 3;
        const startCol = blockCol * 3;
        for (let row = startRow; row < startRow + 3; row++) {
          for (let col = startCol; col < startCol + 3; col++) {
            newLocked[row][col] = true;
          }
        }
      }
    }
  }
  
  return newLocked;
}
