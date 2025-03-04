var board = null;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
let c_player = 'w'; // Default player color (white)
let timerinstance = null;
let currentmatchtime = null;
// Sounds
const moveSound = new Audio('./sounds/move.mp3');
const captureSound = new Audio('./sounds/capture.mp3');
const checkSound = new Audio('./sounds/check.mp3');
const castleSound = new Audio('./sounds/castle.mp3');
const startSound = new Audio('./sounds/start.mp3');
const endSound = new Audio('./sounds/end.mp3');

// Highlight legal moves
function removeHighlights() {
  $('.square-55d63').removeClass('highlight check');
  $('.square-55d63').find('.legal-dot').remove();
}

function highlightSquare(square) {
  const $square = $('.square-' + square);
  if ($square.find('.legal-dot').length === 0) {
    $square.append('<div class="legal-dot"></div>');
  }
}

function showLegalMoves(source) {
  const legalMoves = game.moves({ square: source, verbose: true });
  legalMoves.forEach((move) => highlightSquare(move.to));
}

function onDragStart(source, piece) {
  if (game.game_over() || game.turn() !== c_player) return false;
  if ((game.turn() === 'w' && piece.startsWith('b')) ||
      (game.turn() === 'b' && piece.startsWith('w'))) {
    return false;
  }
  removeHighlights();
  showLegalMoves(source);
}

function onDrop(source, target) {
  removeHighlights();
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  playSound(move);
  updateStatus();
  board.position(game.fen());
  if (game.turn() !== c_player) {
    setTimeout(makeStockfishMove, 500);
  }
}

function updateStatus() {
  let status = game.turn() === 'b' ? 'Mueven las negras' : 'Mueven las blancas';
  if (game.in_checkmate()) {
    status = `Juego terminado, ${game.turn() === 'w' ? 'Negras' : 'Blancas'} ganan!`;
    endSound.play();
  } else if (game.in_draw()) {
    status = 'Juego terminado, posición empatada!';
    endSound.play();
  }
  $status.html(status);
  $pgn.text(game.pgn());
}

function playSound(move) {
  if (move.flags.includes('c')) captureSound.play();
  else if (move.flags.includes('k') || move.flags.includes('q')) castleSound.play();
  else if (game.in_check()) checkSound.play();
  else moveSound.play();
}

function makeStockfishMove() {
  stockfish.postMessage('position fen ' + game.fen());
  stockfish.postMessage('go movetime 1000');
}

const stockfish = new Worker('/public/js/stockfish.js');
stockfish.postMessage('uci');
stockfish.onmessage = function(event) {
  const message = event.data;
  if (message.startsWith('bestmove')) {
    const move = message.split(' ')[1];
    game.move(move, { sloppy: true });
    board.position(game.fen());
    updateStatus();
    playSound({ flags: '' });
  }
};

// New function to be called from IA.html modal
function startStockfishGame(color, level) {
  startSound.play();
  c_player = color; // 'w' or 'b' from modal
  stockfish.postMessage('setoption name Skill Level value ' + level);
  game.reset();
  board.start();
  board.orientation(color === 'w' ? 'white' : 'black');
  updateStatus();
  
  // If player is black, make first move as white
  if (c_player === 'b') {
    setTimeout(makeStockfishMove, 500);
  }
  
  // Update robot message
  const robotMessage = document.querySelector('.robot-message p');
  if (robotMessage) {
    robotMessage.textContent = `¡Jugando con dificultad ${level}! ¡Buena suerte!`;
  }
}

// Keep the old event listener for backward compatibility or remove if not needed
document.getElementById('play-stockfish').addEventListener('click', function() {
  // This will now be handled by the modal in IA.html
  // The modal will call startStockfishGame() directly
});

const config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
};
board = ChessBoard('myBoard', config);
updateStatus();

// Make the function available globally so it can be called from IA.html
window.startStockfishGame = startStockfishGame;