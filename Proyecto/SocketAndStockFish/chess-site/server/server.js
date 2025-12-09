const http = require('http'),
      path = require('path'),
      express = require('express'),
      handlebars = require('express-handlebars'),
      socket = require('socket.io');

const config = require('../config');

const myIo = require('./sockets/io'),
      routes = require('./routes/routes');

const app = express(),
      server = http.Server(app),
      io = socket(server);

// En entorno normal el servidor escucha en el puerto configurado.
// En entorno de pruebas (NODE_ENV=test), supertest usa directamente `app`
// y no es necesario abrir un puerto, evitando errores EADDRINUSE entre tests.
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port);
  console.log(`Server listening on port ${config.port}`);
}

games = {};

myIo(io);

const Handlebars = handlebars.create({
  extname: '.html', 
  partialsDir: path.join(__dirname, '..', 'front', 'views', 'partials'), 
  defaultLayout: false,
  helpers: {}
});
app.engine('html', Handlebars.engine);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '..', 'front', 'views'));
app.use('/public', express.static(path.join(__dirname, '..', 'front', 'public')));

routes(app);

// Exportamos la app de Express para poder usarla en pruebas automatizadas (supertest)
module.exports = app;