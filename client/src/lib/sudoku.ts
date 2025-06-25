export function generateSudoku(): number[][] {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  fillBoard(board);
  return board;
}

// Get all possible values for a cell based on current board state
function getPossibleValues(board: number[][], row: number, col: number): number[] {
  if (board[row][col] !== 0) return [];
  
  const used = new Set<number>();
  
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] !== 0) used.add(board[row][c]);
  }
  
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] !== 0) used.add(board[r][col]);
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] !== 0) used.add(board[r][c]);
    }
  }
  
  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (!used.has(num)) possible.push(num);
  }
  
  return possible;
}

// Check if a puzzle can be solved using only logical deduction
function canSolveWithLogic(board: number[][]): boolean {
  const workingBoard = board.map(row => [...row]);
  let changed = true;
  
  while (changed) {
    changed = false;
    
    // Strategy 1: Naked singles - cells with only one possible value
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workingBoard[row][col] === 0) {
          const possible = getPossibleValues(workingBoard, row, col);
          if (possible.length === 1) {
            workingBoard[row][col] = possible[0];
            changed = true;
          } else if (possible.length === 0) {
            return false; // Invalid state
          }
        }
      }
    }
    
    // Strategy 2: Hidden singles - only one cell in a unit can contain a number
    // Check rows
    for (let row = 0; row < 9; row++) {
      for (let num = 1; num <= 9; num++) {
        const possibleCols = [];
        for (let col = 0; col < 9; col++) {
          if (workingBoard[row][col] === 0) {
            const possible = getPossibleValues(workingBoard, row, col);
            if (possible.includes(num)) {
              possibleCols.push(col);
            }
          }
        }
        if (possibleCols.length === 1) {
          workingBoard[row][possibleCols[0]] = num;
          changed = true;
        }
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      for (let num = 1; num <= 9; num++) {
        const possibleRows = [];
        for (let row = 0; row < 9; row++) {
          if (workingBoard[row][col] === 0) {
            const possible = getPossibleValues(workingBoard, row, col);
            if (possible.includes(num)) {
              possibleRows.push(row);
            }
          }
        }
        if (possibleRows.length === 1) {
          workingBoard[possibleRows[0]][col] = num;
          changed = true;
        }
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        for (let num = 1; num <= 9; num++) {
          const possibleCells = [];
          for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
              if (workingBoard[r][c] === 0) {
                const possible = getPossibleValues(workingBoard, r, c);
                if (possible.includes(num)) {
                  possibleCells.push([r, c]);
                }
              }
            }
          }
          if (possibleCells.length === 1) {
            const [r, c] = possibleCells[0];
            workingBoard[r][c] = num;
            changed = true;
          }
        }
      }
    }
  }
  
  // Check if puzzle is completely solved
  return isCompleted(workingBoard);
}

// Generate a logically solvable Sudoku puzzle with improved algorithm
export function generateLogicalSudoku(solution: number[][], filledCells: number): number[][] {
  // Start with a simple approach - just remove cells ensuring unique solution
  const puzzle = solution.map(row => [...row]);
  const cellsToRemove = 81 - filledCells;
  const positions = [];
  
  // Create list of all positions
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions randomly
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Try to remove cells one by one
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    
    const originalValue = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // Check if puzzle still has unique solution
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      // Restore the cell if removing it creates multiple solutions
      puzzle[row][col] = originalValue;
    }
    
    // Stop if we've removed enough cells
    if (removed >= cellsToRemove) break;
  }
  
  return puzzle;
}

// Check if puzzle has unique solution (optimized version)
function hasUniqueSolution(board: number[][]): boolean {
  let solutionCount = 0;
  const workingBoard = board.map(row => [...row]);
  
  function countSolutions(board: number[][]): void {
    if (solutionCount > 1) return; // Early exit if multiple solutions found
    
    // Find first empty cell
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              countSolutions(board);
              board[row][col] = 0;
              
              if (solutionCount > 1) return; // Early exit
            }
          }
          return; // Backtrack
        }
      }
    }
    
    // Found a complete solution
    solutionCount++;
  }
  
  countSolutions(workingBoard);
  return solutionCount === 1;
}

// Simple puzzle creation as fallback
function createSimplePuzzle(solution: number[][], filledCells: number): number[][] {
  const puzzle = solution.map(row => [...row]);
  const totalCells = 81;
  const cellsToRemove = totalCells - filledCells;
  
  const positions = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle and remove cells
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = 0;
  }
  
  return puzzle;
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
