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
 * RNF-02 - Autenticación segura y gestión de sesión
 *
 * Casos de prueba automatizados para verificar que las rutas protegidas
 * solo son accesibles para usuarios autenticados.
 */

describe('RNF-02 - Autenticación segura y gestión de sesión', () => {
  
  describe('TC-RNF02-01 - Acceso solo para usuarios autenticados', () => {
    
    test('GET /white sin autenticación debe devolver 401', async () => {
      const res = await request(app)
        .get('/white')
        .redirects(0);

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toContain('autenticación');
    });

    test('GET /black sin autenticación debe devolver 401', async () => {
      const res = await request(app)
        .get('/black')
        .query({ code: 'ABC123' })
        .redirects(0);

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toContain('autenticación');
    });

    test('GET /white con autenticación válida debe permitir acceso', async () => {
      const res = await request(app)
        .get('/white')
        .set('X-Auth-User', 'test-user')
        .redirects(0);

      // Debe permitir el acceso (200) y renderizar la vista
      expect(res.status).toBe(200);
      expect(res.text).toContain('chess'); // La vista de juego debería tener contenido de ajedrez
    });

    test('GET /black con autenticación válida y código válido debe permitir acceso', async () => {
      // Primero necesitamos crear una partida válida
      // Como no tenemos acceso directo a games en los tests, 
      // este test verificará que con autenticación y código válido no se rechaza por falta de auth
      const res = await request(app)
        .get('/black')
        .set('X-Auth-User', 'test-user')
        .query({ code: 'ABC123' })
        .redirects(0);

      // Con autenticación válida, no debe ser 401
      // Puede ser 302 (redirect por código inválido) o 200 (acceso permitido)
      // pero NO debe ser 401
      expect(res.status).not.toBe(401);
    });
  });

  describe('Verificación de token inválido', () => {
    
    test('Request sin header de autenticación debe rechazarse', async () => {
      const res = await request(app)
        .get('/white')
        .redirects(0);

      expect(res.status).toBe(401);
    });

    test('Request con header X-Auth-User vacío debe rechazarse', async () => {
      const res = await request(app)
        .get('/white')
        .set('X-Auth-User', '')
        .redirects(0);

      expect(res.status).toBe(401);
    });
  });

  describe('Protección de múltiples rutas', () => {
    
    const protectedRoutes = [
      { path: '/white', description: 'ruta de juego blanco' },
      { path: '/black', query: { code: 'TEST12' }, description: 'ruta de juego negro' }
    ];

    protectedRoutes.forEach(route => {
      test(`${route.description} (${route.path}) debe estar protegida`, async () => {
        const req = request(app).get(route.path).redirects(0);
        
        if (route.query) {
          req.query(route.query);
        }

        const res = await req;
        expect(res.status).toBe(401);
      });
    });
  });
});
