
// Constants
const CLASSES = {
    CELL: 'cell',
    PIECE: 'piece',
    VALID_MOVE: 'valid-move',
    SELECTED: 'selected',
    JUMP_NUMBER: 'jump-number',
    TURN_DISPLAY: 'turn-display'
};

// Game state management
let selectedPiece = null;
let validMoves = [];

// DOM references
const grid = document.getElementById('grid');
const turnDisplay = document.getElementById('turnDisplay');

/**
 * Initialize the game and fetch initial state
 */
async function initGame() {
    await fetchAndRenderGameState();
}

/**
 * Fetch game state from server and render the board
 */
async function fetchAndRenderGameState() {
    const response = await fetch('/api/state');
    const gameState = await response.json();
    renderBoard(gameState);
    updateTurnDisplay(gameState.currentPlayer);
}

/**
 * Render the game board based on state from server
 */
function renderBoard(gameState) {
    grid.innerHTML = '';
    const board = gameState.board;
    
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = document.createElement('div');
            cell.className = CLASSES.CELL;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col]) {
                const piece = document.createElement('div');
                piece.className = `${CLASSES.PIECE} ${board[row][col]}`;
                cell.appendChild(piece);
            }
            
            cell.addEventListener('pointerdown', handleCellClick);
            grid.appendChild(cell);
        }
    }
}

/**
 * Update the turn display
 */
function updateTurnDisplay(currentPlayer) {
    turnDisplay.textContent = `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'}'s Turn`;
    turnDisplay.className = `${CLASSES.TURN_DISPLAY} ${currentPlayer}`;
}

/**
 * Handle cell click event
 */
async function handleCellClick(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (selectedPiece) {
        // Try to move piece
        await attemptMove(selectedPiece, row, col);
    } else {
        // Try to select piece
        const piece = cell.querySelector(`.${CLASSES.PIECE}`);
        if (piece) {
            await selectPiece(row, col);
        }
    }
}

/**
 * Select a piece and get valid moves
 */
async function selectPiece(row, col) {
    clearSelection();
    
    try {
        const response = await fetch('/api/select', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ row, col })
        });
        
        const data = await response.json();
        selectedPiece = data.selectedPiece;
        validMoves = data.validMoves;
        
        if (selectedPiece) {
            const cell = getCell(selectedPiece.row, selectedPiece.col);
            const piece = cell.querySelector(`.${CLASSES.PIECE}`);
            if (piece) {
                piece.classList.add(CLASSES.SELECTED, 'selected-piece');
            }
            
            // Highlight valid moves
            validMoves.forEach(([targetRow, targetCol, jumps]) => {
                const moveCell = getCell(targetRow, targetCol);
                moveCell.classList.add(CLASSES.VALID_MOVE);
                
                // Add jump number indicator if this is a jump
                if (jumps > 0) {
                    const indicator = document.createElement('span');
                    indicator.className = CLASSES.JUMP_NUMBER;
                    indicator.textContent = jumps;
                    moveCell.appendChild(indicator);
                }
            });
        }
    } catch (error) {
        console.error('Error selecting piece:', error);
    }
}

/**
 * Attempt to move a piece
 */
async function attemptMove(selectedPiece, toRow, toCol) {
    const validMove = validMoves.some(([row, col]) => row === toRow && col === toCol);
    
    if (!validMove) {
        clearSelection();
        return;
    }
    
    try {
        const response = await fetch('/api/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fromRow: selectedPiece.row,
                fromCol: selectedPiece.col,
                toRow: toRow,
                toCol: toCol
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await fetchAndRenderGameState();
        } else {
            console.error('Move failed:', data.message);
        }
    } catch (error) {
        console.error('Error moving piece:', error);
    } finally {
        clearSelection();
    }
}

/**
 * Clear selection and valid move indicators
 */
function clearSelection() {
    document.querySelectorAll(`.${CLASSES.VALID_MOVE}`).forEach(cell => {
        cell.classList.remove(CLASSES.VALID_MOVE);
    });
    
    document.querySelectorAll(`.${CLASSES.JUMP_NUMBER}`).forEach(indicator => {
        indicator.remove();
    });
    
    document.querySelectorAll(`.${CLASSES.SELECTED}`).forEach(piece => {
        piece.classList.remove(CLASSES.SELECTED, 'selected-piece');
    });
    
    selectedPiece = null;
    validMoves = [];
}

/**
 * Get a cell element by coordinates
 */
function getCell(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

/**
 * Reset the game
 */
async function resetGame() {
    try {
        await fetch('/api/reset', { method: 'POST' });
        await fetchAndRenderGameState();
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Hide rules on mobile devices
if (window.innerWidth <= 600) {
    const rulesEl = document.querySelector('.rules-display');
    if (rulesEl) rulesEl.style.display = 'none';
}