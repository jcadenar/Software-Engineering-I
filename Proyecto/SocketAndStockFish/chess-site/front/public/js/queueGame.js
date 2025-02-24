let gameHasStarted = false;
let board = null;
let game = new Chess();
let gameOver = false;
let playerColor = null;

const $status = $('#status');
const $pgn = $('#pgn');

$('#buscarPartida').on('click', function() {
    socket.emit('buscarPartida');
    $status.html('Buscando partida...');
});

socket.on('partidaEncontrada', function(data) {
    playerColor = data.color;
    gameHasStarted = true;
    
    if (playerColor === 'black') {
        board.flip();
    }
    
    $status.html('Partida encontrada. Juegas con ' + playerColor);
    updateStatus();
});

function onDragStart(source, piece) {
    if (game.game_over() || !gameHasStarted || gameOver) return false;
    if ((playerColor === 'black' && piece.startsWith('w')) ||
        (playerColor === 'white' && piece.startsWith('b'))) {
        return false;
    }
    if ((game.turn() === 'w' && playerColor !== 'white') ||
        (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
    }
}

function onDrop(source, target) {
    let move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    
    socket.emit('move', move);
    updateStatus();
}

socket.on('newMove', function(move) {
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

socket.on('gameOverDisconnect', function() {
    gameOver = true;
    $status.html('Tu oponente se ha desconectado. Ganaste.');
});

function updateStatus() {
    let status = game.turn() === 'b' ? 'Turno de las negras' : 'Turno de las blancas';
    if (game.in_checkmate()) {
        status = '¡Jaque mate! ' + (game.turn() === 'w' ? 'Negras' : 'Blancas') + ' ganan.';
        gameOver = true;
    } else if (game.in_draw()) {
        status = 'Partida terminada en tablas';
        gameOver = true;
    }
    $status.html(status);
    $pgn.html(game.pgn());
}

let config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
updateStatus();
