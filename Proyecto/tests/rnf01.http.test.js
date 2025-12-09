const request = require('supertest');
const path = require('path');

// Importamos la app de Express configurada
const app = require(path.join(
  __dirname,
  '..',
  'SocketAndStockFish',
  'chess-site',
  'server',
  'server'
));

/**
 * RNF-01 - Validación y sanitización de entradas
 *
 * Caso de prueba automatizado para la ruta GET /black con código de sala inválido.
 * Verifica que el sistema no acepta códigos de sala que no cumplen el formato
 * y redirige a /?error=invalidCode.
 */

describe('RNF-01 - Validación de código de sala en /black', () => {
  test('rechaza código de sala inválido y redirige con error=invalidCode', async () => {
    const res = await request(app)
      .get('/black')
      // Simulamos un usuario autenticado para aislar la validación del código (RNF-01)
      .set('X-Auth-User', 'test-user')
      .query({ code: '<script>' }) // código claramente inválido
      .redirects(0);               // no seguir redirecciones automáticamente

    // Debe responder con redirección (3xx) a /?error=invalidCode
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.location).toBe('/?error=invalidCode');
  });
});
