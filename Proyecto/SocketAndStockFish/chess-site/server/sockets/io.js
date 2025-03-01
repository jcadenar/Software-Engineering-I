let waitingPlayer = null; // Variable para almacenar al jugador en espera

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
            currentCode = data.code;
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

    });
};
