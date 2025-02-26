# Super Chinese Checkers - Architecture Overview

## Overview
The Super Chinese Checkers project is a digital implementation of a variation of the traditional Chinese Checkers board game. This version allows pieces to jump over other pieces at any distance, provided the landing spot is equidistant from the jumped piece. The architecture is designed to handle game logic, user interface, and player interactions on a rectangular 5x20 grid.

## Implemented Components

### 1. Game Logic
The game logic in `index.js` includes:

- **Board Representation**: 
  - Implemented as a 5x20 grid of cells
  - Each cell can contain a player piece or be empty
  - Pieces are visually represented with red (Player 1) or blue (Player 2/AI) colored divs

- **Rules Engine**:
  - Fully implements Super Chinese Checkers rules for valid moves:
    - Adjacent single-step moves
    - Jumping over pieces at any distance with the jumped piece at the midpoint
    - Multiple consecutive jumps tracked and displayed

- **Move Validation**:
  - The `showValidMoves` function identifies and highlights all valid moves for a selected piece
  - `isPathClear` verifies that the path between cells is valid for jumping
  - Efficient pathfinding using a queue-based approach to find all possible moves

- **Game State Management**:
  - Tracks current player's turn with visual indicators
  - Maintains move history with timestamp, start position, and end position
  - Supports AI vs. human and human vs. human game modes via toggle

### 2. User Interface
- **Graphical Representation**: 
  - Grid-based board with responsive sizing
  - Colored pieces with visual feedback on selection
  - Highlighted cells for valid moves with jump count indicators

- **User Input Handling**: 
  - Click/touch to select pieces and make moves
  - Visual feedback for selected pieces and valid destinations
  - Mode toggle button for switching between AI and two-player modes

- **Display Components**:
  - Turn indicator showing current player
  - Rules explanation display (hidden on mobile)
  - Game mode selector

### 3. Player Interaction
- **Human Player**: Implemented with intuitive click/touch interaction
- **AI Player**: Simple AI that prioritizes moves reducing column position (moving toward goal)
- **Game Mode Toggle**: Switch between playing against AI or another human player

## Data Flow
1. **User Input**: Player clicks/taps a piece of their color
2. **Selection Processing**: System highlights the piece and calculates valid moves
3. **Move Visualization**: Valid destinations are highlighted with indicators showing jump counts
4. **Move Execution**: Player clicks a valid destination to complete their move
5. **Game State Update**: Turn switches to the next player
6. **AI Processing**: If AI mode is enabled and it's AI's turn, it automatically selects and makes a move

## AI Implementation
The AI uses a simple heuristic approach:
- Evaluates all possible moves for each AI piece
- Prioritizes moves that advance pieces toward the goal (reducing column position)
- Executes moves with animated timing for better visibility

## Responsive Design
- Adapts to different screen sizes
- Portrait orientation on mobile devices with rotated board
- Simplified interface on smaller screens (hides rules)

## Future Enhancements
Potential improvements that could be implemented:
1. Win condition detection and game completion flow
2. More sophisticated AI with different difficulty levels
3. Local storage for saving game state
4. Customizable board sizes and colors
5. More traditional hexagonal board representation