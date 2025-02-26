import os
from datetime import datetime
from flask import Flask, render_template, session, jsonify, request, redirect, url_for
from game.core import ChineseCheckersGame

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

@app.route('/')
def index():
    """Render the main game page"""
    # Initialize a new game if needed
    if 'game' not in session:
        session['game'] = ChineseCheckersGame()
    
    return render_template('index.html')

@app.route('/api/state')
def get_state():
    """Get the current game state"""
    if 'game' not in session:
        session['game'] = ChineseCheckersGame()
    
    game = session['game']
    return jsonify(game.get_board_state())

@app.route('/api/select', methods=['POST'])
def select_piece():
    """Select a piece and get valid moves"""
    data = request.get_json()
    row, col = data.get('row'), data.get('col')
    
    game = session['game']
    valid_moves = game.get_valid_moves(row, col)
    
    return jsonify({
        'validMoves': valid_moves,
        'selectedPiece': {'row': row, 'col': col}
    })

@app.route('/api/move', methods=['POST'])
def move_piece():
    """Move a piece on the board"""
    data = request.get_json()
    from_row, from_col = data.get('fromRow'), data.get('fromCol')
    to_row, to_col = data.get('toRow'), data.get('toCol')
    
    game = session['game']
    move_result = game.move_piece(from_row, from_col, to_row, to_col)
    
    if move_result:
        # Add timestamp to the last move
        if game.move_history:
            game.move_history[-1]['timestamp'] = datetime.now().strftime('%H:%M:%S')
        
        session['game'] = game  # Update session
        return jsonify({
            'success': True, 
            'state': game.get_board_state()
        })
    
    return jsonify({
        'success': False,
        'message': 'Invalid move'
    })

@app.route('/api/reset', methods=['POST'])
def reset_game():
    """Reset the game to initial state"""
    session['game'] = ChineseCheckersGame()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)