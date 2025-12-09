const { requireAuth } = require('../middleware/auth');
const { logInvalidGameCode, logValidationFailure } = require('../utils/logger');

module.exports = app => {

    // Reutilizamos la misma validación de código de sala que en sockets (RNF-01)
    function isValidGameCode(code) {
        if (typeof code !== 'string') return false;
        return /^[A-Z0-9]{6}$/.test(code);
    }

    app.get('/', (req, res) => {
        res.render('index');
    });

    // Rutas protegidas con autenticación (RNF-02)
    // Solo usuarios autenticados pueden acceder a las salas de juego
    app.get('/white', requireAuth, (req, res) => {
        res.render('game', {
            color: 'white',
            user: req.user
        });
    });
    
    app.get('/black', requireAuth, (req, res) => {
        const code = req.query.code ? String(req.query.code).toUpperCase() : '';

        // Validación de código de sala (RNF-01)
        if (!isValidGameCode(code) || !games[code]) {
            // RNF-05: Registrar intento de acceso con código inválido
            logInvalidGameCode(code, req);
            logValidationFailure('gameCode', code, req);
            return res.redirect('/?error=invalidCode');
        }

        res.render('game', {
            color: 'black',
            user: req.user
        });
    });
};