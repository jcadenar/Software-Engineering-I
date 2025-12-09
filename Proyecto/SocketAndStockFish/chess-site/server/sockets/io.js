let waitingPlayer = null; // Variable para almacenar al jugador en espera

// Función de ayuda: valida que un código de juego tenga 6 caracteres alfanuméricos en mayúsculas
function isValidGameCode(code) {
    if (typeof code !== 'string') return false;
    return /^[A-Z0-9]{6}$/.test(code);
}

// Función de ayuda: sanitiza un mensaje de chat (tipo string, longitud acotada)
function sanitizeChatMessage(message) {
    if (typeof message !== 'string') {
        message = String(message ?? '');
    }
    message = message.trim();
    const MAX_LENGTH = 500;
    if (message.length > MAX_LENGTH) {
        message = message.slice(0, MAX_LENGTH);
    }
    return message;
}

module.exports = io => {
    io.on('connection', socket => {
        console.log('New socket connection');

        let currentCode = null;

        function generateGameCode() {
            return Math.random().toString(36).substring(2, 8).toUpperCase(); // Código de 6 caracteres alfanuméricos
        }

        socket.on('move', function(move) {
            console.log('move detected');
            io.to(currentCode).emit('newMove', move);
        });

        socket.on('createGame', function() {
            let gameCode = generateGameCode();
            currentCode = gameCode;
            socket.join(gameCode);
            games[gameCode] = true;

            socket.emit('gameCreated', { code: gameCode });
        });

        socket.on('joinGame', function(data) {
            const code = data && data.code ? String(data.code).toUpperCase() : '';

            // Validación de código de sala (RNF-01)
            if (!isValidGameCode(code)) {
                console.warn('joinGame rechazado por código inválido:', code);
                socket.emit('error-joinGame', { message: 'Código de partida inválido.' });
                return;
            }

            currentCode = code;
            socket.join(currentCode);

            if (!games[currentCode]) {
                games[currentCode] = true;
                return;
            }
            
            io.to(currentCode).emit('startGame');
        });

        socket.on('disconnect', function() {
            console.log('socket disconnected');

            if (currentCode) {
                io.to(currentCode).emit('gameOverDisconnect');
                delete games[currentCode];
            }
        });

        // Manejo de la cola de emparejamiento
        socket.on('buscarPartida', function() {
            if (waitingPlayer === null) {
                // No hay jugadores en espera, agregamos este a la cola
                waitingPlayer = socket;
                socket.emit('searching', { message: 'Esperando oponente...' });
            } else {
                // Hay un jugador esperando, creamos una partida
                let gameCode = Math.random().toString(36).substr(2, 8); // Código de partida aleatorio

                // Asignamos colores a los jugadores de manera aleatoria
                let colors = Math.random() < 0.5 ? ['white', 'black'] : ['black', 'white'];

                // Enviar a ambos jugadores la información de la partida
                waitingPlayer.emit('partidaEncontrada', { code: gameCode, color: colors[0] });
                socket.emit('partidaEncontrada', { code: gameCode, color: colors[1] });

                // Ambos jugadores entran a la sala
                waitingPlayer.join(gameCode);
                socket.join(gameCode);
                games[gameCode] = true; // Registramos la partida
                io.to(gameCode).emit('startGame');

                // Limpiamos la cola de espera
                waitingPlayer = null;
            }
        });

        // Manejo de mensajes de chat con validación y sanitización básica (RNF-01)
        socket.on('chat-message', function(data) {
            const rawGameCode = data && data.gameCode ? String(data.gameCode).toUpperCase() : '';
            const color = data && data.color ? String(data.color) : '';
            const sanitizedMessage = sanitizeChatMessage(data && data.message);

            console.log('Chat message received (sanitized):', sanitizedMessage);
            
            // Validar código de juego y mensaje antes de reenviar
            if (!isValidGameCode(rawGameCode) || !games[rawGameCode]) {
                console.warn('chat-message rechazado por gameCode inválido:', rawGameCode);
                return;
            }

            if (!sanitizedMessage) {
                // Mensaje vacío tras sanitización, no lo reenviamos
                return;
            }

            // Validar color opcionalmente (solo white/black)
            const allowedColors = ['white', 'black'];
            const safeColor = allowedColors.includes(color) ? color : 'white';

            socket.to(rawGameCode).emit('chat-message', {
                message: sanitizedMessage,
                color: safeColor
            });
        });
    });
};