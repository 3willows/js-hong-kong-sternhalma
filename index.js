/*
* Chinese Checkers Core Game Module
* Maintains game state and handling rules
* Features: 
* - Turn-based gameplay
* - Valid move calculation
* - Move history tracking
* - Player state management
*/

// Game Constants
const ROWS = 5;
const COLS = 20;
const PLAYERS = {
  ONE: 'player1',
  TWO: 'player2'
};

// Game State
let selectedPiece = null;
let currentPlayer = PLAYERS.ONE;
const moveHistory = [];
const grid = document.getElementById('grid');

// DOM Constants
const CLASSES = {
  CELL: 'cell',
  PIECE: 'piece',
  VALID_MOVE: 'valid-move',
  SELECTED: 'selected',
  JUMP_NUMBER: 'jump-number',
  TURN_DISPLAY: 'turn-display'
};

/**
 * Creates a game piece element with proper styling
 * @param {string} playerClass - CSS class for player styling
 * @returns {HTMLElement} Created piece element
 */
function createPiece(playerClass) {
  const piece = document.createElement('div');
  piece.className = `${CLASSES.PIECE} ${playerClass}`;
  return piece;
}

/**
 * Validates cell coordinates against game board dimensions
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} True if valid cell coordinates
 */
function isValidCell(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/**
 * Gets DOM cell element by coordinates
 * @param {number} row - Row index 
 * @param {number} col - Column index
 * @returns {HTMLElement|null} Cell element or null
 */
function getCell(row, col) {
  return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

/**
 * Updates turn display with current player information
 */
function updateTurnDisplay() {
  const turnDisplay = document.getElementById(CLASSES.TURN_DISPLAY);
  turnDisplay.textContent = `${currentPlayer === PLAYERS.ONE ? 'Player 1' : 'Player 2'}'s Turn`;
  turnDisplay.className = `${CLASSES.TURN_DISPLAY} ${currentPlayer}`;
}

/**
 * Clears current selection state and valid move indicators
 */
function clearSelection() {
  // Clear visual indicators
  document.querySelectorAll(`.${CLASSES.VALID_MOVE}`).forEach(c => c.classList.remove(CLASSES.VALID_MOVE));
  document.querySelectorAll(`.${CLASSES.JUMP_NUMBER}`).forEach(n => n.remove());
  
  // Reset selected piece
  if (selectedPiece) {
    selectedPiece.element.classList.remove(CLASSES.SELECTED, 'selected-piece');
    selectedPiece = null;
  }
}

/**
 * Initializes game board with cells and starting pieces
 */
function createBoard() {
  // Clear existing board
  grid.innerHTML = '';
  
  // Board creation helper functions
  const createCell = (row, col) => {
    const cell = document.createElement('div');
    cell.className = CLASSES.CELL;
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.addEventListener('click', handleClick);
    return cell;
  };

  const addStartingPieces = (cell, row, col) => {
    // Player 1 pieces (left side)
    if (col < 2 && (row * 2 + col) < 10) {
      cell.appendChild(createPiece(PLAYERS.ONE));
    }
    // Player 2 pieces (right side)
    if (col >= COLS - 2 && (row * 2 + (COLS - col - 1)) < 10) {
      cell.appendChild(createPiece(PLAYERS.TWO));
    }
  };

  // Build board grid
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = createCell(row, col);
      addStartingPieces(cell, row, col);
      grid.appendChild(cell);
    }
  }

  // Initialize turn display
  const turnDisplay = document.createElement('div');
  turnDisplay.id = CLASSES.TURN_DISPLAY;
  document.body.insertBefore(turnDisplay, grid);
  updateTurnDisplay();
}

/**
 * Handles cell click events for piece selection and movement
 * @param {Event} e - Click event
 */
function handleClick(e) {
  const cell = e.currentTarget;
  const piece = cell.querySelector(`.${CLASSES.PIECE}`);

  if (selectedPiece) {
    handleMoveAttempt(cell);
  } else if (piece) {
    handlePieceSelection(cell, piece);
  }
}

/**
 * Processes movement attempt to target cell
 * @param {HTMLElement} targetCell - Destination cell element
 */
function handleMoveAttempt(targetCell) {
  if (!targetCell.classList.contains(CLASSES.VALID_MOVE)) {
    clearSelection();
    return;
  }

  // Execute valid move
  movePiece(selectedPiece, targetCell);
  recordMoveHistory(targetCell);
  clearSelection();
  switchPlayers();
}

/**
 * Records move data to history
 * @param {HTMLElement} targetCell - Destination cell element
 */
function recordMoveHistory(targetCell) {
  const moveData = {
    player: currentPlayer,
    from: { 
      row: selectedPiece.row, 
      col: selectedPiece.col 
    },
    to: { 
      row: parseInt(targetCell.dataset.row), 
      col: parseInt(targetCell.dataset.col) 
    },
    timestamp: new Date().toLocaleTimeString()
  };
  moveHistory.push(moveData);
  console.log('Move History:', moveHistory);
}

/**
 * Handles piece selection and valid move display
 * @param {HTMLElement} cell - Clicked cell element
 * @param {HTMLElement} piece - Selected piece element
 */
function handlePieceSelection(cell, piece) {
  // Validate ownership
  if (!piece.classList.contains(currentPlayer)) return;

  // Set selection state
  selectedPiece = {
    element: piece,
    row: parseInt(cell.dataset.row),
    col: parseInt(cell.dataset.col)
  };
  piece.classList.add(CLASSES.SELECTED, 'selected-piece');
  showValidMoves(cell);
}

/**
 * Checks if path between cells is clear for movement
 * @param {number} startRow - Starting row index
 * @param {number} startCol - Starting column index
 * @param {number} endRow - Target row index
 * @param {number} endCol - Target column index
 * @returns {boolean} True if path is clear
 */
function isPathClear(startRow, startCol, endRow, endCol) {
  const deltaRow = Math.sign(endRow - startRow);
  const deltaCol = Math.sign(endCol - startCol);
  
  let currentRow = startRow + deltaRow;
  let currentCol = startCol + deltaCol;

  while (currentRow !== endRow || currentCol !== endCol) {
    const currentCell = getCell(currentRow, currentCol);
    
    // Allow jumping over exactly one piece at midpoint
    const isMidpoint = currentRow === startRow + (endRow - startRow)/2 && 
                      currentCol === startCol + (endCol - startCol)/2;
    
    if (!isMidpoint && currentCell.querySelector(`.${CLASSES.PIECE}:not(.selected-piece)`)) {
      return false;
    }

    currentRow += deltaRow;
    currentCol += deltaCol;
  }

  return true;
}

/**
 * Displays valid moves for selected piece using BFS
 * @param {HTMLElement} fromCell - Origin cell element
 */
function showValidMoves(fromCell) {
  const startRow = parseInt(fromCell.dataset.row);
  const startCol = parseInt(fromCell.dataset.col);
  
  // Movement configuration
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1]
  ];

  // BFS initialization
  const visited = new Map();
  const queue = [[startRow, startCol, 0]];

  // Process jump moves
  while (queue.length > 0) {
    const [row, col, jumps] = queue.shift();
    const cellKey = `${row},${col}`;

    // Skip already visited paths with better jump counts
    if (visited.has(cellKey) && visited.get(cellKey) <= jumps) continue;
    visited.set(cellKey, jumps);

    // Explore all directions
    for (const [dRow, dCol] of directions) {
      let step = 1;
      while (true) {
        const checkRow = row + dRow * step;
        const checkCol = col + dCol * step;

        // Boundary check
        if (!isValidCell(checkRow, checkCol)) break;
        
        const checkCell = getCell(checkRow, checkCol);
        if (checkCell.querySelector(`.${CLASSES.PIECE}`)) {
          processJumpMove(queue, row, col, checkRow, checkCol, dRow, dCol, step, jumps, visited);
          break;
        }
        step++;
      }
    }
  }

  // Add single-step moves
  processSingleStepMoves(startRow, startCol, directions);
  // Update DOM with valid moves
  updateValidMoveIndicators(visited, startRow, startCol);
}

/**
 * Processes potential jump moves in given direction
 * @param {Array} queue - BFS processing queue
 * @param {number} baseRow - Current row position
 * @param {number} baseCol - Current column position
 * @param {number} checkRow - Check row position
 * @param {number} checkCol - Check column position
 * @param {number} dRow - Direction row delta
 * @param {number} dCol - Direction column delta
 * @param {number} step - Current step size
 * @param {number} jumps - Current jump count
 * @param {Map} visited - Visited cells tracker
 */
function processJumpMove(queue, baseRow, baseCol, checkRow, checkCol, dRow, dCol, step, jumps, visited) {
  const jumpRow = baseRow + dRow * step * 2;
  const jumpCol = baseCol + dCol * step * 2;

  if (!isValidCell(jumpRow, jumpCol)) return;
  if (!isPathClear(baseRow, baseCol, jumpRow, jumpCol)) return;

  const jumpKey = `${jumpRow},${jumpCol}`;
  const totalJumps = jumps + 1;
  const jumpCell = getCell(jumpRow, jumpCol);

  if (!jumpCell.querySelector(`.${CLASSES.PIECE}`) && 
     (!visited.has(jumpKey) || totalJumps < visited.get(jumpKey))) {
    queue.push([jumpRow, jumpCol, totalJumps]);
    updateMoveIndicator(jumpCell, totalJumps);
  }
}

/**
 * Adds single-step move indicators around origin
 * @param {number} startRow - Origin row
 * @param {number} startCol - Origin column
 * @param {Array} directions - Movement directions
 */
function processSingleStepMoves(startRow, startCol, directions) {
  for (const [dRow, dCol] of directions) {
    const targetRow = startRow + dRow;
    const targetCol = startCol + dCol;
    
    if (isValidCell(targetRow, targetCol)) {
      const cell = getCell(targetRow, targetCol);
      if (!cell.querySelector(`.${CLASSES.PIECE}`)) {
        cell.classList.add(CLASSES.VALID_MOVE);
      }
    }
  }
}

/**
 * Updates DOM elements with move indicators
 * @param {Map} visited - Visited cells data
 * @param {number} startRow - Origin row
 * @param {number} startCol - Origin column
 */
function updateValidMoveIndicators(visited, startRow, startCol) {
  visited.forEach((jumps, key) => {
    const [row, col] = key.split(',').map(Number);
    if (row === startRow && col === startCol) return;
    
    const cell = getCell(row, col);
    if (cell && !cell.querySelector(`.${CLASSES.PIECE}`)) {
      updateMoveIndicator(cell, jumps);
    }
  });
}

/**
 * Updates individual cell with move indicator
 * @param {HTMLElement} cell - Target cell element
 * @param {number} jumps - Number of jumps required
 */
function updateMoveIndicator(cell, jumps) {
  cell.classList.add(CLASSES.VALID_MOVE);
  
  // Clear existing jump number
  const existingNumber = cell.querySelector(`.${CLASSES.JUMP_NUMBER}`);
  if (existingNumber) existingNumber.remove();

  // Add new jump indicator
  const jumpNumber = document.createElement('span');
  jumpNumber.className = CLASSES.JUMP_NUMBER;
  jumpNumber.textContent = jumps;
  cell.appendChild(jumpNumber);
}

/**
 * Moves piece to target cell and updates state
 * @param {Object} from - Move origin data
 * @param {HTMLElement} toCell - Target cell element
 */
function movePiece(from, toCell) {
  toCell.appendChild(from.element);
  from.element.classList.remove(CLASSES.SELECTED);
}

/**
 * Switches active player and updates display
 */
function switchPlayers() {
  currentPlayer = currentPlayer === PLAYERS.ONE ? PLAYERS.TWO : PLAYERS.ONE;
  updateTurnDisplay();
}

// Initialize game on load
createBoard();