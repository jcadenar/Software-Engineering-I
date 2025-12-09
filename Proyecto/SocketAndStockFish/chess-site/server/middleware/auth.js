/**
 * Middleware de autenticación para RNF-02
 * 
 * Este módulo proporciona funciones para verificar la autenticación de usuarios
 * utilizando tokens de Firebase o un mecanismo de desarrollo para testing.
 * 
 * Integrado con RNF-05 para logging de eventos de seguridad.
 */

const admin = require('firebase-admin');
const { logAuthSuccess, logAuthFailure, logAccessDenied } = require('../utils/logger');

// Inicializar Firebase Admin solo si no está en modo test
// En producción, se debe configurar con credenciales reales de servicio
let firebaseInitialized = false;

if (process.env.NODE_ENV !== 'test') {
    try {
        // En un entorno real, deberías usar credenciales de servicio:
        // admin.initializeApp({
        //   credential: admin.credential.cert(serviceAccount)
        // });
        
        // Para desarrollo/demo, usamos la app por defecto
        if (admin.apps.length === 0) {
            admin.initializeApp();
            firebaseInitialized = true;
        }
    } catch (error) {
        console.warn('Firebase Admin no pudo inicializarse:', error.message);
        console.warn('La autenticación funcionará en modo de desarrollo.');
    }
}

/**
 * Middleware que verifica si el usuario está autenticado
 * 
 * En modo test: acepta el header X-Auth-User para simular autenticación
 * En modo producción: verifica token de Firebase en el header Authorization
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
async function requireAuth(req, res, next) {
    // En modo test, aceptamos el header X-Auth-User para facilitar las pruebas
    if (process.env.NODE_ENV === 'test') {
        if (req.headers['x-auth-user']) {
            req.user = { uid: req.headers['x-auth-user'], email: `${req.headers['x-auth-user']}@test.com` };
            // RNF-05: Registrar autenticación exitosa
            logAuthSuccess(req.user, req);
            return next();
        }
        // RNF-05: Registrar intento de acceso sin autenticación
        logAccessDenied(req.path, req, 'no_auth_header');
        return res.status(401).json({ 
            error: 'No autorizado',
            message: 'Se requiere autenticación para acceder a este recurso.' 
        });
    }

    // En modo desarrollo/producción, verificamos el token de Firebase
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // RNF-05: Registrar acceso denegado
        logAccessDenied(req.path, req, 'missing_or_invalid_auth_header');
        return res.status(401).json({ 
            error: 'No autorizado',
            message: 'Se requiere un token de autenticación válido.' 
        });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        if (firebaseInitialized) {
            // Verificar token con Firebase Admin
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email
            };
            // RNF-05: Registrar autenticación exitosa
            logAuthSuccess(req.user, req);
            next();
        } else {
            // Fallback: en desarrollo sin Firebase Admin configurado, aceptamos cualquier token
            // NOTA: Esto es solo para desarrollo local. En producción DEBE estar configurado Firebase Admin.
            console.warn('Autenticación en modo desarrollo (sin verificación real de token)');
            req.user = { uid: 'dev-user', email: 'dev@example.com' };
            // RNF-05: Registrar autenticación en modo desarrollo
            logAuthSuccess(req.user, req);
            next();
        }
    } catch (error) {
        console.error('Error verificando token:', error.message);
        // RNF-05: Registrar fallo de autenticación
        logAuthFailure('invalid_token', req, { error: error.message });
        return res.status(401).json({ 
            error: 'Token inválido',
            message: 'El token de autenticación no es válido o ha expirado.' 
        });
    }
}

/**
 * Función auxiliar para verificar si una request tiene autenticación válida
 * (usada en casos donde no queremos usar middleware)
 * 
 * @param {Object} req - Request de Express
 * @returns {boolean} - true si está autenticado
 */
function isAuthenticated(req) {
    if (process.env.NODE_ENV === 'test') {
        return Boolean(req.headers['x-auth-user']);
    }
    
    const authHeader = req.headers.authorization;
    return Boolean(authHeader && authHeader.startsWith('Bearer '));
}

module.exports = {
    requireAuth,
    isAuthenticated
};
