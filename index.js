// Chinese Checkers Core Game Module
// Maintains game state, valid move calculations, move history and player state

// Constants
const ROWS = 5;
const COLS = 20;
const PLAYERS = {
  ONE: 'player1',
  TWO: 'player2'
};

const CLASSES = {
  CELL: 'cell',
  PIECE: 'piece',
  VALID_MOVE: 'valid-move',
  SELECTED: 'selected',
  JUMP_NUMBER: 'jump-number',
  TURN_DISPLAY: 'turn-display',
  MODE_TOGGLE: 'mode-toggle'
};

// Game State
let selectedPiece = null;
let currentPlayer = PLAYERS.ONE;
const moveHistory = [];
const grid = document.getElementById('grid');
let aiEnabled = true; // Default to AI mode instead of two human players
let aiIsPlaying = false; // New flag to track when AI is making a move

/** Helper Functions **/

const createPiece = playerClass => {
  const piece = document.createElement('div');
  piece.className = `${CLASSES.PIECE} ${playerClass}`;
  return piece;
};

const isValidCell = (row, col) => row >= 0 && row < ROWS && col >= 0 && col < COLS;

const getCell = (row, col) => document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

const updateTurnDisplay = () => {
  const turnDisplay = document.getElementById(CLASSES.TURN_DISPLAY);
  
  // Show "AI's Turn" when it's player 2's turn and AI is enabled
  if (currentPlayer === PLAYERS.TWO && aiEnabled) {
    turnDisplay.textContent = "AI's Turn";
  } else {
    turnDisplay.textContent = `${currentPlayer === PLAYERS.ONE ? 'Player 1' : 'Player 2'}'s Turn`;
  }
  
  turnDisplay.className = `${CLASSES.TURN_DISPLAY} ${currentPlayer}`;
};

const clearValidMoveIndicators = () => {
  document.querySelectorAll(`.${CLASSES.VALID_MOVE}`)
    .forEach(cell => cell.classList.remove(CLASSES.VALID_MOVE));
  document.querySelectorAll(`.${CLASSES.JUMP_NUMBER}`)
    .forEach(el => el.remove());
};

const clearSelection = () => {
  clearValidMoveIndicators();
  if (selectedPiece) {
    selectedPiece.element.classList.remove(CLASSES.SELECTED, 'selected-piece');
    selectedPiece = null;
  }
};

/** Board Initializations **/

const createCell = (row, col) => {
  const cell = document.createElement('div');
  cell.className = CLASSES.CELL;
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handleClick(e);
  });
  return cell;
};

const addStartingPieces = (cell, row, col) => {
  // Player 1 pieces on the left side
  if (col < 2 && (row * 2 + col) < 10) {
    cell.appendChild(createPiece(PLAYERS.ONE));
  }
  // Player 2 pieces on the right side
  if (col >= COLS - 2 && (row * 2 + (COLS - col - 1)) < 10) {
    cell.appendChild(createPiece(PLAYERS.TWO));
  }
};

const createBoard = () => {
  grid.innerHTML = '';
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = createCell(row, col);
      addStartingPieces(cell, row, col);
      grid.appendChild(cell);
    }
  }
  
  // Create and insert turn display
  const turnDisplay = document.createElement('div');
  turnDisplay.id = CLASSES.TURN_DISPLAY;
  document.body.insertBefore(turnDisplay, grid);
  
  // Create and insert mode toggle button
  const modeToggle = document.createElement('button');
  modeToggle.id = CLASSES.MODE_TOGGLE;
  modeToggle.className = CLASSES.MODE_TOGGLE;
  modeToggle.textContent = "vs AI"; // Default text shows AI mode is active
  modeToggle.addEventListener('click', toggleGameMode);
  document.body.insertBefore(modeToggle, grid);
  
  updateTurnDisplay();
};

/** Event Handlers **/

const handleClick = e => {
  // Ignore clicks when AI is playing
  if (aiIsPlaying) return;
  
  const cell = e.currentTarget;
  const piece = cell.querySelector(`.${CLASSES.PIECE}`);
  if (selectedPiece) {
    attemptMove(cell);
  } else if (piece) {
    selectPiece(cell, piece);
  }
};

const attemptMove = targetCell => {
  if (!targetCell.classList.contains(CLASSES.VALID_MOVE)) {
    clearSelection();
    return;
  }
  movePiece(selectedPiece, targetCell);
  recordMove(targetCell);
  clearSelection();
  switchPlayer();
};

const recordMove = targetCell => {
  const moveData = {
    player: currentPlayer,
    from: { row: selectedPiece.row, col: selectedPiece.col },
    to: {
      row: parseInt(targetCell.dataset.row),
      col: parseInt(targetCell.dataset.col)
    },
    timestamp: new Date().toLocaleTimeString()
  };
  moveHistory.push(moveData);
  console.log('Move History:', moveHistory);
};

const selectPiece = (cell, piece) => {
  if (!piece.classList.contains(currentPlayer)) return;
  selectedPiece = {
    element: piece,
    row: parseInt(cell.dataset.row),
    col: parseInt(cell.dataset.col)
  };
  piece.classList.add(CLASSES.SELECTED, 'selected-piece');
  showValidMoves(cell);
};

/** Move & Path Functions **/

const isPathClear = (startRow, startCol, endRow, endCol) => {
  const deltaRow = Math.sign(endRow - startRow);
  const deltaCol = Math.sign(endCol - startCol);
  let currentRow = startRow + deltaRow;
  let currentCol = startCol + deltaCol;
  while (currentRow !== endRow || currentCol !== endCol) {
    const currentCell = getCell(currentRow, currentCol);
    const isMidpoint = currentRow === startRow + (endRow - startRow) / 2 &&
      currentCol === startCol + (endCol - startCol) / 2;
    if (!isMidpoint && currentCell.querySelector(`.${CLASSES.PIECE}:not(.selected-piece)`)) {
      return false;
    }
    currentRow += deltaRow;
    currentCol += deltaCol;
  }
  return true;
};

const showValidMoves = fromCell => {
  const startRow = parseInt(fromCell.dataset.row);
  const startCol = parseInt(fromCell.dataset.col);
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  const visited = new Map();
  const queue = [[startRow, startCol, 0]]; // [row, col, jumps]

  while (queue.length) {
    const [row, col, jumps] = queue.shift();
    const key = `${row},${col}`;
    if (visited.has(key) && visited.get(key) <= jumps) continue;
    visited.set(key, jumps);

    for (const [dRow, dCol] of directions) {
      let step = 1;
      while (true) {
        const newRow = row + dRow * step;
        const newCol = col + dCol * step;
        if (!isValidCell(newRow, newCol)) break;
        
        // Add check to prevent jumping over the selected piece itself
        if (newRow === startRow && newCol === startCol) break;
        
        const checkCell = getCell(newRow, newCol);
        if (checkCell.querySelector(`.${CLASSES.PIECE}`)) {
          processJump(queue, row, col, newRow, newCol, dRow, dCol, step, jumps, visited);
          break;
        }
        step++;
      }
    }
  }
  processSingleSteps(startRow, startCol, directions);
  applyValidityIndicators(visited, startRow, startCol);
};

const processJump = (queue, baseRow, baseCol, checkRow, checkCol, dRow, dCol, step, jumps, visited) => {
  const jumpRow = baseRow + dRow * step * 2;
  const jumpCol = baseCol + dCol * step * 2;
  if (!isValidCell(jumpRow, jumpCol)) return;
  if (!isPathClear(baseRow, baseCol, jumpRow, jumpCol)) return;
  const key = `${jumpRow},${jumpCol}`;
  const totalJumps = jumps + 1;
  const jumpCell = getCell(jumpRow, jumpCol);
  if (!jumpCell.querySelector(`.${CLASSES.PIECE}`) &&
    (!visited.has(key) || totalJumps < visited.get(key))) {
    queue.push([jumpRow, jumpCol, totalJumps]);
    updateIndicator(jumpCell, totalJumps);
  }
};

const processSingleSteps = (startRow, startCol, directions) => {
  directions.forEach(([dRow, dCol]) => {
    const targetRow = startRow + dRow;
    const targetCol = startCol + dCol;
    if (isValidCell(targetRow, targetCol)) {
      const cell = getCell(targetRow, targetCol);
      if (!cell.querySelector(`.${CLASSES.PIECE}`)) {
        cell.classList.add(CLASSES.VALID_MOVE);
      }
    }
  });
};

const applyValidityIndicators = (visited, startRow, startCol) => {
  visited.forEach((jumps, key) => {
    const [row, col] = key.split(',').map(Number);
    if (row === startRow && col === startCol) return;
    const cell = getCell(row, col);
    if (cell && !cell.querySelector(`.${CLASSES.PIECE}`)) {
      updateIndicator(cell, jumps);
    }
  });
};

const updateIndicator = (cell, jumps) => {
  cell.classList.add(CLASSES.VALID_MOVE);
  const existing = cell.querySelector(`.${CLASSES.JUMP_NUMBER}`);
  if (existing) existing.remove();
  const indicator = document.createElement('span');
  indicator.className = CLASSES.JUMP_NUMBER;
  indicator.textContent = jumps;
  cell.appendChild(indicator);
};

const movePiece = (from, toCell) => {
  toCell.appendChild(from.element);
  from.element.classList.remove(CLASSES.SELECTED);
};

/** AI Functions **/

const isAITurn = () => currentPlayer === PLAYERS.TWO;

const executeAIMove = () => {
  // Set the flag to indicate AI is playing
  aiIsPlaying = true;
  
  // Give a small delay so the player can see what's happening
  setTimeout(() => {
    const bestMove = findBestMove();
    if (bestMove) {
      // Select the piece to move
      selectPiece(getCell(bestMove.fromRow, bestMove.fromCol), bestMove.piece);
      
      // Execute the move
      setTimeout(() => {
        const targetCell = getCell(bestMove.toRow, bestMove.toCol);
        attemptMove(targetCell);
        
        // Clear the flag when AI move is complete
        aiIsPlaying = false;
      }, 500);
    } else {
      // Clear the flag if no move is found
      aiIsPlaying = false;
    }
  }, 1000);
};

const findBestMove = () => {
  let bestMove = null;
  let bestColReduction = -1;

  // Find all player2 pieces
  document.querySelectorAll(`.${CLASSES.PIECE}.${PLAYERS.TWO}`).forEach(piece => {
    const cell = piece.parentElement;
    const fromRow = parseInt(cell.dataset.row);
    const fromCol = parseInt(cell.dataset.col);

    // Temporarily select this piece to find valid moves
    const tempSelectedPiece = {
      element: piece,
      row: fromRow,
      col: fromCol
    };
    
    // Save current selected piece if any
    const savedSelectedPiece = selectedPiece;
    selectedPiece = tempSelectedPiece;
    
    // Find all valid moves for this piece without showing them on the UI
    const validMoves = findValidMovesForPiece(fromRow, fromCol);
    
    // Evaluate each valid move
    validMoves.forEach(move => {
      const [toRow, toCol, jumps] = move;
      const colReduction = fromCol - toCol;
      
      // Prefer moves that reduce column position
      if (colReduction > bestColReduction) {
        bestColReduction = colReduction;
        bestMove = {
          fromRow,
          fromCol,
          toRow,
          toCol,
          piece: piece
        };
      }
    });
    
    // Restore the original selected piece
    selectedPiece = savedSelectedPiece;
  });
  
  return bestMove;
};

const findValidMovesForPiece = (startRow, startCol) => {
  const validMoves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  const visited = new Map();
  const queue = [[startRow, startCol, 0]]; // [row, col, jumps]

  while (queue.length) {
    const [row, col, jumps] = queue.shift();
    const key = `${row},${col}`;
    if (visited.has(key) && visited.get(key) <= jumps) continue;
    visited.set(key, jumps);

    // Track as valid move if not the starting position
    if (row !== startRow || col !== startCol) {
      const cell = getCell(row, col);
      if (!cell.querySelector(`.${CLASSES.PIECE}`)) {
        validMoves.push([row, col, jumps]);
      }
    }

    for (const [dRow, dCol] of directions) {
      let step = 1;
      while (true) {
        const newRow = row + dRow * step;
        const newCol = col + dCol * step;
        if (!isValidCell(newRow, newCol)) break;
        
        // Add check to prevent jumping over the selected piece itself
        if (newRow === startRow && newCol === startCol) break;
        
        const checkCell = getCell(newRow, newCol);
        if (checkCell.querySelector(`.${CLASSES.PIECE}`)) {
          // Check for jump possibility
          const jumpRow = row + dRow * step * 2;
          const jumpCol = col + dCol * step * 2;
          if (isValidCell(jumpRow, jumpCol)) {
            const jumpCell = getCell(jumpRow, jumpCol);
            if (!jumpCell.querySelector(`.${CLASSES.PIECE}`) && 
                isPathClear(row, col, jumpRow, jumpCol)) {
              const totalJumps = jumps + 1;
              const jumpKey = `${jumpRow},${jumpCol}`;
              if (!visited.has(jumpKey) || totalJumps < visited.get(jumpKey)) {
                queue.push([jumpRow, jumpCol, totalJumps]);
              }
            }
          }
          break;
        }
        step++;
      }
    }
  }

  return validMoves;
};

// Modify the switch player function to respect the current game mode
const switchPlayer = () => {
  currentPlayer = currentPlayer === PLAYERS.ONE ? PLAYERS.TWO : PLAYERS.ONE;
  updateTurnDisplay();
  
  // If AI is enabled and it's its turn, execute AI move
  if (aiEnabled && isAITurn()) {
    executeAIMove();
  }
};

// Toggle between human vs human and human vs AI modes
const toggleGameMode = () => {
  aiEnabled = !aiEnabled;
  
  const modeToggle = document.getElementById(CLASSES.MODE_TOGGLE);
  if (aiEnabled) {
    modeToggle.textContent = "vs AI";
    // If it's already AI's turn, trigger a move
    if (isAITurn()) {
      executeAIMove();
    }
  } else {
    modeToggle.textContent = "2 Players";
  }
  
  // We should restart the game or at least clear any current move in progress
  clearSelection();
};

/** Initialization **/
createBoard();

// Hide rules on mobile devices
if (window.innerWidth <= 600) {
  const rulesEl = document.querySelector('.rules-display');
  if (rulesEl) rulesEl.style.display = 'none';
}

/** Visual Self-Jump Testing Functions **/

// Set up test board with specific configurations to check for self-jumping
const setupSelfJumpTestBoard = () => {
  // Save game state for reset
  window.savedGameState = {
    boardHTML: grid.innerHTML,
    currentPlayer: currentPlayer,
    aiEnabled: aiEnabled
  };
  
  // Clear the board
  grid.innerHTML = '';
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = createCell(row, col);
      grid.appendChild(cell);
    }
  }
  
  // Disable AI during test
  aiEnabled = false;
  currentPlayer = PLAYERS.ONE;
  
  // Scenario 1: Complex Jump Network - pieces arranged in a pattern that offers multiple jump paths
  placePiece(2, 5, PLAYERS.ONE);  // Player piece at center of network
  
  // Jump opportunities in multiple directions
  placePiece(2, 7, PLAYERS.TWO);  // Right
  placePiece(2, 3, PLAYERS.TWO);  // Left
  placePiece(0, 5, PLAYERS.TWO);  // Up
  placePiece(4, 5, PLAYERS.TWO);  // Down
  placePiece(1, 4, PLAYERS.TWO);  // Diagonal up-left
  placePiece(3, 6, PLAYERS.TWO);  // Diagonal down-right
  
  // Scenario 2: Sequential Jump Test - multiple pieces arranged for chain jumps
  placePiece(1, 10, PLAYERS.ONE); // Starting piece
  
  // Pieces creating potential jump chain
  placePiece(1, 12, PLAYERS.TWO);
  placePiece(1, 14, PLAYERS.TWO);
  placePiece(1, 16, PLAYERS.TWO);
  placePiece(3, 10, PLAYERS.TWO);
  placePiece(3, 12, PLAYERS.TWO);
  
  // Scenario 3: ZigZag Jump Pattern
  placePiece(4, 15, PLAYERS.ONE); // Player piece
  
  // Pieces forming a zigzag pattern
  placePiece(3, 16, PLAYERS.TWO);
  placePiece(2, 15, PLAYERS.TWO);
  placePiece(1, 16, PLAYERS.TWO);
  placePiece(0, 15, PLAYERS.TWO);
  
  // Scenario 4: Potential Jump Loop - if self-jumping were allowed, this could create a loop
  placePiece(3, 1, PLAYERS.ONE);  // Player piece
  
  // Pieces arranged in a pattern that could create a loop with self-jumping
  placePiece(2, 0, PLAYERS.TWO);
  placePiece(1, 1, PLAYERS.TWO);
  placePiece(2, 2, PLAYERS.TWO);
  
  // Show reset button and info
  document.getElementById('reset-board').style.display = 'block';
  document.getElementById('test-info').style.display = 'block';
  document.getElementById('test-self-jump').style.display = 'none';
  
  // Update the test info text to be more descriptive
  document.getElementById('test-info').innerHTML = 
    'Testing Mode: Try moving the red pieces to verify proper jumping behavior.<br>' +
    '• Check that jumps follow proper midpoint rules<br>' +
    '• Verify no self-jumping occurs<br>' +
    '• Test chain jumps for correct behavior';
  
  // Update display
  updateTurnDisplay();
  clearSelection();
};

// Reset board to pre-test state
const resetTestBoard = () => {
  if (window.savedGameState) {
    grid.innerHTML = window.savedGameState.boardHTML;
    currentPlayer = window.savedGameState.currentPlayer;
    aiEnabled = window.savedGameState.aiEnabled;
    
    // Hide test-related UI
    document.getElementById('reset-board').style.display = 'none';
    document.getElementById('test-info').style.display = 'none';
    document.getElementById('test-self-jump').style.display = 'block';
    
    // Clean up
    window.savedGameState = null;
    
    // Update display
    updateTurnDisplay();
    clearSelection();
  }
};

// Helper function for tests
const placePiece = (row, col, playerClass) => {
  const cell = getCell(row, col);
  if (cell) {
    const existingPiece = cell.querySelector(`.${CLASSES.PIECE}`);
    if (existingPiece) existingPiece.remove();
    cell.appendChild(createPiece(playerClass));
  }
};

/** Initialization **/
// ...existing code...

// Initialize test buttons
document.addEventListener('DOMContentLoaded', () => {
  const testButton = document.getElementById('test-self-jump');
  const resetButton = document.getElementById('reset-board');
  
  if (testButton) {
    testButton.addEventListener('click', setupSelfJumpTestBoard);
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', resetTestBoard);
  }
  
  // On mobile, hide the test button unless in debug mode
  if (window.innerWidth <= 600) {
    testButton.style.display = 'none';
    
    // Add debug mode toggle with triple tap
    let tapCount = 0;
    let lastTap = 0;
    
    document.addEventListener('touchend', () => {
      const currentTime = new Date().getTime();
      if (currentTime - lastTap < 500) {
        tapCount++;
        if (tapCount === 3) {
          testButton.style.display = 'block';
          tapCount = 0;
        }
      } else {
        tapCount = 1;
      }
      lastTap = currentTime;
    });
  }
});