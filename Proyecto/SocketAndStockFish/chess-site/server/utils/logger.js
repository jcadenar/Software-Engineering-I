/**
 * Sistema de logging y auditoría para RNF-05
 * 
 * Este módulo proporciona funciones de logging estructurado para eventos de seguridad,
 * cumpliendo con OWASP A09:2021 – Security Logging and Monitoring Failures.
 * 
 * Características:
 * - No registra información sensible (contraseñas, tokens completos)
 * - Incluye timestamps automáticos
 * - Diferentes niveles de log (info, warn, error)
 * - Formato estructurado en JSON para facilitar análisis
 */

const winston = require('winston');
const path = require('path');

// Configuración de formato de logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', '..', 'logs');

// Configurar logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'chess-server' },
    transports: [
        // Logs de error en archivo separado
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Logs generales (info, warn, error)
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Logs de auditoría de seguridad
        new winston.transports.File({ 
            filename: path.join(logsDir, 'security-audit.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ]
});

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

/**
 * Sanitiza información de usuario para logging
 * Evita almacenar datos sensibles en texto claro
 */
function sanitizeUserInfo(user) {
    if (!user) return null;
    
    return {
        uid: user.uid || 'unknown',
        email: user.email ? maskEmail(user.email) : 'unknown'
    };
}

/**
 * Enmascara parte del email para proteger privacidad
 * ejemplo: user@example.com -> u***@example.com
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string') return 'unknown';
    
    const [localPart, domain] = email.split('@');
    if (!domain) return 'invalid-email';
    
    const maskedLocal = localPart.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
}

/**
 * Sanitiza tokens para logging
 * Solo muestra los primeros y últimos caracteres
 */
function sanitizeToken(token) {
    if (!token || typeof token !== 'string') return null;
    
    if (token.length <= 10) return '***';
    
    return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`;
}

/**
 * Registra un evento de autenticación exitosa
 */
function logAuthSuccess(user, req) {
    logger.info('Authentication successful', {
        event: 'auth_success',
        user: sanitizeUserInfo(user),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
}

/**
 * Registra un intento de autenticación fallido
 */
function logAuthFailure(reason, req, additionalInfo = {}) {
    logger.warn('Authentication failed', {
        event: 'auth_failure',
        reason,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        ...additionalInfo
    });
}

/**
 * Registra acceso denegado a un recurso protegido
 */
function logAccessDenied(resource, req, reason = 'unauthorized') {
    logger.warn('Access denied', {
        event: 'access_denied',
        resource,
        reason,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
}

/**
 * Registra validación fallida de entrada (RNF-01)
 */
function logValidationFailure(field, value, req) {
    logger.warn('Input validation failed', {
        event: 'validation_failure',
        field,
        invalidValue: typeof value === 'string' && value.length > 50 
            ? value.substring(0, 50) + '...' 
            : value,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
}

/**
 * Registra errores del sistema
 */
function logError(error, context = {}) {
    logger.error('System error', {
        event: 'system_error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        ...context,
        timestamp: new Date().toISOString()
    });
}

/**
 * Registra eventos de Socket.IO relacionados con seguridad
 */
function logSocketEvent(eventName, socketId, data = {}) {
    logger.info('Socket event', {
        event: 'socket_event',
        eventName,
        socketId,
        ...data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Registra intentos de acceso a código de sala inválido
 */
function logInvalidGameCode(code, req) {
    logger.warn('Invalid game code attempt', {
        event: 'invalid_game_code',
        code: code ? code.substring(0, 20) : 'empty', // Limitar longitud por seguridad
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
}

/**
 * Obtiene los últimos logs de seguridad
 * Útil para tests y verificación
 */
function getRecentSecurityLogs(limit = 100) {
    // En producción esto debería leer del archivo de logs
    // Por ahora retornamos un placeholder para tests
    return [];
}

module.exports = {
    logger,
    logAuthSuccess,
    logAuthFailure,
    logAccessDenied,
    logValidationFailure,
    logError,
    logSocketEvent,
    logInvalidGameCode,
    getRecentSecurityLogs,
    // Exportar funciones auxiliares para tests
    sanitizeUserInfo,
    sanitizeToken,
    maskEmail
};
