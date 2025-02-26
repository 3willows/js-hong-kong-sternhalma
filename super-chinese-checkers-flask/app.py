import os
import pickle
from datetime import datetime
from flask import Flask, render_template, session, jsonify, request, redirect, url_for
from game.core import ChineseCheckersGame

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

# Use filesystem session storage instead of cookies
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = '.flask_session/'
app.config['SESSION_USE_SIGNER'] = True

# Make sure the session directory exists
os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)

# Initialize Flask-Session
from flask_session import Session
Session(app)

@app.route('/')
def index():
    """Render the main game page"""
    # Create a new game if needed
    if 'game_pickle' not in session:
        session['game_pickle'] = pickle.dumps(ChineseCheckersGame())
    
    return render_template('index.html')

@app.route('/api/state')
def get_state():
    """Get the current game state"""
    if 'game_pickle' not in session:
        session['game_pickle'] = pickle.dumps(ChineseCheckersGame())
    
    game = pickle.loads(session['game_pickle'])
    return jsonify(game.get_board_state())

@app.route('/api/select', methods=['POST'])
def select_piece():
    """Select a piece and get valid moves"""
    data = request.get_json()
    row, col = data.get('row'), data.get('col')
    
    game = pickle.loads(session['game_pickle'])
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
    
    game = pickle.loads(session['game_pickle'])
    move_result = game.move_piece(from_row, from_col, to_row, to_col)
    
    if move_result:
        # Add timestamp to the last move
        if game.move_history:
            game.move_history[-1]['timestamp'] = datetime.now().strftime('%H:%M:%S')
        
        # Save updated game to session
        session['game_pickle'] = pickle.dumps(game)
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
    session['game_pickle'] = pickle.dumps(ChineseCheckersGame())
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)