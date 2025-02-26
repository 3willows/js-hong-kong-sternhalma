
class ChineseCheckersGame:
    ROWS = 5
    COLS = 20
    PLAYERS = {
        "ONE": "player1",
        "TWO": "player2"
    }

    def __init__(self):
        self.current_player = self.PLAYERS["ONE"]
        self.move_history = []
        self.board = self.create_initial_board()
        self.selected_piece = None

    def create_initial_board(self):
        """Create the initial game board with pieces in starting positions"""
        board = [[None for _ in range(self.COLS)] for _ in range(self.ROWS)]
        
        # Add player 1 pieces on the left side
        for row in range(self.ROWS):
            for col in range(2):
                if (row * 2 + col) < 10:
                    board[row][col] = self.PLAYERS["ONE"]
        
        # Add player 2 pieces on the right side
        for row in range(self.ROWS):
            for col in range(self.COLS - 2, self.COLS):
                if (row * 2 + (self.COLS - col - 1)) < 10:
                    board[row][col] = self.PLAYERS["TWO"]
                    
        return board

    def is_valid_cell(self, row, col):
        """Check if coordinates are within the board boundaries"""
        return 0 <= row < self.ROWS and 0 <= col < self.COLS

    def get_valid_moves(self, start_row, start_col):
        """Calculate valid moves from a given position"""
        if self.board[start_row][start_col] != self.current_player:
            return []
            
        valid_moves = []
        directions = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1), (0, 1),
            (1, -1), (1, 0), (1, 1)
        ]
        
        # Process single steps
        for d_row, d_col in directions:
            target_row = start_row + d_row
            target_col = start_col + d_col
            if (self.is_valid_cell(target_row, target_col) and 
                    not self.board[target_row][target_col]):
                valid_moves.append((target_row, target_col, 0))  # 0 jumps
        
        # Process jumps
        visited = {}  # (row, col) -> jumps
        queue = [(start_row, start_col, 0)]  # (row, col, jumps)
        
        while queue:
            row, col, jumps = queue.pop(0)
            key = (row, col)
            if key in visited and visited[key] <= jumps:
                continue
            visited[key] = jumps
            
            for d_row, d_col in directions:
                step = 1
                while True:
                    check_row = row + d_row * step
                    check_col = col + d_col * step
                    
                    if not self.is_valid_cell(check_row, check_col):
                        break
                        
                    if self.board[check_row][check_col]:  # Found a piece
                        jump_row = row + d_row * step * 2
                        jump_col = col + d_col * step * 2
                        
                        if (self.is_valid_cell(jump_row, jump_col) and 
                                not self.board[jump_row][jump_col] and
                                self.is_path_clear(row, col, jump_row, jump_col)):
                                    
                            jump_key = (jump_row, jump_col)
                            total_jumps = jumps + 1
                            
                            if jump_key not in visited or total_jumps < visited[jump_key]:
                                queue.append((jump_row, jump_col, total_jumps))
                                valid_moves.append((jump_row, jump_col, total_jumps))
                        break
                    step += 1
        
        return valid_moves

    def is_path_clear(self, start_row, start_col, end_row, end_col):
        """Check if the path is clear for a jump"""
        delta_row = 1 if end_row > start_row else (-1 if end_row < start_row else 0)
        delta_col = 1 if end_col > start_col else (-1 if end_col < start_col else 0)
        
        mid_row = start_row + (end_row - start_row) // 2
        mid_col = start_col + (end_col - start_col) // 2
        
        current_row, current_col = start_row + delta_row, start_col + delta_col
        
        while current_row != end_row or current_col != end_col:
            is_midpoint = current_row == mid_row and current_col == mid_col
            
            if not is_midpoint and self.board[current_row][current_col]:
                return False
                
            current_row += delta_row
            current_col += delta_col
            
        return True

    def move_piece(self, start_row, start_col, end_row, end_col):
        """Move a piece on the board and record the move"""
        if self.board[start_row][start_col] != self.current_player:
            return False
            
        # Find if this is a valid move
        valid_moves = self.get_valid_moves(start_row, start_col)
        if (end_row, end_col) not in [(r, c) for r, c, _ in valid_moves]:
            return False
            
        # Move the piece
        self.board[end_row][end_col] = self.board[start_row][start_col]
        self.board[start_row][start_col] = None
        
        # Record the move
        move_data = {
            "player": self.current_player,
            "from": {"row": start_row, "col": start_col},
            "to": {"row": end_row, "col": end_col},
            "timestamp": ""  # Will be set in app.py
        }
        self.move_history.append(move_data)
        
        # Switch player
        self.current_player = self.PLAYERS["TWO"] if self.current_player == self.PLAYERS["ONE"] else self.PLAYERS["ONE"]
        return True
        
    def get_board_state(self):
        """Get the current state of the board for rendering"""
        return {
            "board": self.board,
            "currentPlayer": self.current_player,
            "moveHistory": self.move_history
        }