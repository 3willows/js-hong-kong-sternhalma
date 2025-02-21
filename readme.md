# Live website

https://3willows.github.io/super-chinese-checkers/

## About

The version of Chinese Checkers I play at home is apparently a variation called ["Super Chinese Checkers"](https://www.mastersofgames.com/rules/chinese-checkers-rules.htm), where (quote)

> "...a piece may jump over a piece any number of empty spaces away, provided it can land the same number of empty spaces beyond it in a straight line.

> Put another way: A piece can jump a single other piece at any distance, provided that the jumped piece lies at the exact midpoint of the jump. The basic 'adjacent jump' allowed in the standard game is just the shortest form of a long jump."

As there is no readily available online version of this, I decided to make my own.

## Process

Initially I wanted to modify existing open source repos, but found it difficult to map of the hexagonal board onto a 2-D grid (e.g. as was done [here](https://forgitaboutit.github.io/sternhalma-aka-chinese-checkers/)).

So I decided to simply by modifying the game to a game on a rectangular grid.

Prompts to get the project started.

- Build a simplified, rectangular sternhalma on s 5 x 20 grid.
- With html and js only
- Good, now add movable pieces. 10 on each end of the grid.
- Add a "jump" logic to this function "showValidMoves(fromCell)... [copy and paste the full function]"
- Now add 2-step jumping. Example. Suppose there is a piece at (0,0), nothing at (0,1), a piece (pivot) at (0,2), nothing at (0,3) and (0,4). Then you should be able to jump from (0,0) to (0,4).
- No. The modification should implement something like super-chinese-checkers, were a piece may jump over a piece any number of empty spaces away, provided it can land the same number of empty spaces beyond it in a straight line.

After that, I had to do a degree of thinking.  For example, 

- it took some wrangling to get the jumping behaviour to work correctly?

- using "textContent" to record the number of jumps required to get somewhere was too aggressive.  Clearing it by "setting cell.textContent = """ took out everything within as well (including the piece).

## Initial ideas for further development

- Properly test and debug: obviously illegal moves sometimes come to the surface.

- Save the past moves.  Once that is done, presumably can train by some kind of repeated trial and error?

- Add AI: the simplest would be to make whichever move would jump the furtherest for each turn?


## Decision to archive

I tried a few prompts to implement new features, e.g. 

- adding chess-style co-ordinates (e.g. A-E for rows, 1 to 20 for columns)
- properly displaying past moves
- multi-player with socket.io

But one glance at the responses is enough to tell me that this is beyond the capacity of 1 single javascript file loaded with the website.

I probably need to start thinking about a client/server architecture and also some non-browser database to save all the moves made by players.

I could use Node.js (and thereby staying within the Javascript eco-system).  But a better approach will likely to convert everything to Python, given the more mature eco-system there for data analysis.

Perhaps I should start this project by feeding the Code to LLM and asking it to produce specifications?