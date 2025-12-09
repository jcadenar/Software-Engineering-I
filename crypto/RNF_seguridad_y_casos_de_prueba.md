# Requisitos No Funcionales de Seguridad y Casos de Prueba

## RNF seleccionados

- **RNF-01** Validación y sanitización de entradas.
- **RNF-02** Autenticación segura y gestión de sesión.
- **RNF-05** Logging y auditoría de eventos de seguridad.
- **RNF-06** Comunicación segura mediante TLS (al menos en entorno de pruebas).
- **RNF-07** Protección básica contra fuerza bruta/DoS.
- **RNF-08** Marco OWASP que conecta los RNF anteriores.

---

## RNF-01 – Validación y sanitización de entradas

### Descripción
Todo dato que ingrese al sistema (formularios web, parámetros en URL, mensajes por Socket.IO) debe ser validado y sanitizado tanto en el cliente como en el servidor, para evitar inyecciones y corrupción del estado del juego.

### Riesgos OWASP relacionados
- A01:2021 – Broken Access Control (indirectamente, al proteger ciertos parámetros)
- A03:2021 – Injection
- A05:2021 – Security Misconfiguration

### Casos de prueba propuestos

#### Caso 1.1 – Aceptar solo datos válidos (positivo)
- **ID:** TC-RNF01-01
- **Objetivo:** Verificar que el sistema acepta datos correctos y los procesa correctamente.
- **Ámbito:** Formularios de login / unión a sala / creación de sala.
- **Precondiciones:** Servidor y front en ejecución.
- **Pasos:**
  1. Ingresar datos válidos (correo correcto, contraseña válida, código de sala alfanumérico simple).
  2. Enviar el formulario o mensaje.
- **Resultado esperado:**
  - No se muestra mensaje de error de validación.
  - Se completa la acción (login exitoso, sala creada o unión exitosa).
  - No se registra ningún error en los logs.
- **Riesgo OWASP asociado:** A03:2021 – Injection.

#### Caso 1.2 – Rechazar entradas con caracteres peligrosos (negativo)
- **ID:** TC-RNF01-02
- **Objetivo:** Comprobar que el sistema rechaza o limpia entradas con caracteres que podrían generar inyecciones.
- **Ámbito:** Código de sala, nombre de usuario, otros campos visibles en el juego.
- **Precondiciones:** Servidor y front en ejecución.
- **Pasos:**
  1. Ingresar en un campo de texto una cadena con caracteres peligrosos, por ejemplo:
     - `<script>alert('x')</script>`
     - `"; DROP TABLE users; --`
  2. Enviar el formulario o petición.
- **Resultado esperado:**
  - El sistema no ejecuta ningún script ni se rompe la interfaz.
  - Se muestra un mensaje de error de validación o el valor es limpiado/sanitizado.
  - Si se registra el intento en logs, el contenido aparece escapado o acotado, sin romper el log.
- **Riesgo OWASP asociado:** A03:2021 – Injection.

#### Caso 1.3 – Validación en cliente y servidor (defensa en profundidad)
- **ID:** TC-RNF01-03
- **Objetivo:** Verificar que existe validación tanto en el front como en el back.
- **Ámbito:** Cualquier endpoint o acción que reciba datos del usuario.
- **Precondiciones:** Servidor y front en ejecución.
- **Pasos:**
  1. Intentar enviar un valor inválido aprovechando solo el cliente (por ejemplo, escribiendo texto no permitido y enviando el formulario).
  2. Forzar el envío de un valor inválido intentando saltarse las validaciones del front (por ejemplo, modificando la petición con herramientas de desarrollo o cliente HTTP externo).
- **Resultado esperado:**
  - Aunque el dato pase las validaciones del front, el servidor también lo rechaza o lo limpia.
  - El intento puede registrarse en logs como dato inválido (opcional, según diseño).
- **Riesgo OWASP asociado:** A03:2021 – Injection.

---

## RNF-02 – Autenticación segura y gestión de sesión

### Descripción
El sistema debe garantizar que únicamente usuarios autenticados puedan acceder a las funcionalidades de juego online, y que las sesiones sean gestionadas de forma segura para prevenir robo de sesión y uso indebido.

### Riesgos OWASP relacionados
- A01:2021 – Broken Access Control
- A07:2021 – Identification and Authentication Failures

### Casos de prueba propuestos

#### Caso 2.1 – Acceso solo para usuarios autenticados
- **ID:** TC-RNF02-01
- **Objetivo:** Verificar que las páginas protegidas solo son accesibles para usuarios autenticados.
- **Ámbito:** Páginas de lobby, salas de juego, rutas protegidas.
- **Precondiciones:** Servidor en ejecución.
- **Pasos:**
  1. Sin hacer login, intentar acceder directamente a una URL protegida (por ejemplo, la página de juego o una sala específica).
  2. Observar el comportamiento del sistema.
  3. Realizar un login válido.
  4. Volver a acceder a la misma URL protegida.
- **Resultado esperado:**
  - Sin login: el sistema redirige a la página de login o muestra un mensaje de "no autorizado".
  - Con login: el acceso a la página protegida es permitido.
- **Riesgo OWASP asociado:** A01:2021 – Broken Access Control, A07:2021 – Identification and Authentication Failures.

#### Caso 2.2 – Manejo de sesión tras logout
- **ID:** TC-RNF02-02
- **Objetivo:** Verificar que al hacer logout la sesión queda invalidada.
- **Ámbito:** Flujo de cierre de sesión y acceso posterior a páginas protegidas.
- **Precondiciones:** Usuario con sesión iniciada correctamente.
- **Pasos:**
  1. Iniciar sesión correctamente.
  2. Acceder a una página protegida del sistema (lobby, juego, etc.).
  3. Ejecutar la acción de logout.
  4. Intentar recargar la página protegida o acceder nuevamente a la misma URL.
- **Resultado esperado:**
  - Tras el logout ya no se puede acceder a las páginas protegidas.
  - El sistema redirige a login o muestra un mensaje de "no autorizado".
- **Riesgo OWASP asociado:** A07:2021 – Identification and Authentication Failures.

#### Caso 2.3 – Manejo de credenciales incorrectas
- **ID:** TC-RNF02-03
- **Objetivo:** Verificar que el sistema rechaza credenciales incorrectas de manera segura.
- **Ámbito:** Formulario de login.
- **Precondiciones:** Usuario registrado existente.
- **Pasos:**
  1. Intentar iniciar sesión con un correo existente pero con contraseña errónea.
  2. Repetir el intento varias veces con contraseñas distintas pero incorrectas.
- **Resultado esperado:**
  - No se inicia sesión.
  - El mensaje de error es genérico y no revela si el correo existe o no (según política definida).
  - Opcional: se registran los intentos de login fallidos en los logs.
- **Riesgo OWASP asociado:** A07:2021 – Identification and Authentication Failures.

---

## RNF-05 – Logging y auditoría de eventos de seguridad

### Descripción
El sistema debe registrar eventos de seguridad relevantes para auditoría y análisis de incidentes, sin almacenar información sensible en texto claro.

### Riesgos OWASP relacionados
- A09:2021 – Security Logging and Monitoring Failures

### Casos de prueba propuestos

#### Caso 5.1 – Registro de login exitoso
- **ID:** TC-RNF05-01
- **Objetivo:** Verificar que un login exitoso genera un registro de auditoría.
- **Ámbito:** Proceso de autenticación.
- **Precondiciones:** Mecanismo de logging habilitado.
- **Pasos:**
  1. Iniciar sesión con credenciales válidas.
  2. Consultar los logs del sistema (archivo, consola, herramienta de logging, etc.).
- **Resultado esperado:**
  - Existe una entrada de log con:
    - Fecha y hora (timestamp).
    - Identificador de usuario (correo o ID).
    - Acción: "login exitoso".
  - No se registran contraseñas ni tokens en texto claro.
- **Riesgo OWASP asociado:** A09:2021 – Security Logging and Monitoring Failures.

#### Caso 5.2 – Registro de intentos fallidos de login
- **ID:** TC-RNF05-02
- **Objetivo:** Verificar que los intentos fallidos de autenticación quedan registrados.
- **Ámbito:** Proceso de autenticación.
- **Precondiciones:** Mecanismo de logging habilitado.
- **Pasos:**
  1. Intentar iniciar sesión con credenciales incorrectas varias veces.
  2. Consultar los logs.
- **Resultado esperado:**
  - Existen entradas de log con:
    - Timestamp.
    - Identificador de usuario o correo ingresado (si se almacena).
    - Acción: "login fallido".
  - No se registran contraseñas ni datos sensibles.
- **Riesgo OWASP asociado:** A09:2021 – Security Logging and Monitoring Failures.

#### Caso 5.3 – Registro de eventos críticos del juego
- **ID:** TC-RNF05-03
- **Objetivo:** Comprobar que eventos relevantes de negocio se registran (creación de sala, unión, abandono).
- **Ámbito:** Flujo de creación y unión a salas, y abandono.
- **Precondiciones:** Mecanismo de logging habilitado.
- **Pasos:**
  1. Crear una sala.
  2. Un segundo usuario se une a la sala.
  3. Uno de los usuarios abandona la sala.
  4. Revisar los logs generados.
- **Resultado esperado:**
  - Hay al menos una entrada por cada evento: "sala creada", "usuario se unió", "usuario salió".
  - Cada evento incluye identificador de usuario e identificador de sala.
  - No se almacenan datos de juego irrelevantes o sensibles innecesarios.
- **Riesgo OWASP asociado:** A09:2021 – Security Logging and Monitoring Failures.

---

## RNF-06 – Comunicación segura mediante TLS

### Descripción
Toda comunicación entre cliente y servidor debe realizarse sobre HTTPS (y wss/HTTPS para sockets), protegiendo contra espionaje y manipulación de datos.

### Riesgos OWASP relacionados
- A02:2021 – Cryptographic Failures

### Casos de prueba propuestos

#### Caso 6.1 – Acceso solo por HTTPS
- **ID:** TC-RNF06-01
- **Objetivo:** Verificar que el sistema fuerza o requiere el uso de HTTPS.
- **Ámbito:** Acceso web al front y back.
- **Precondiciones:** Servidor configurado con soporte HTTPS (aunque sea con certificado de pruebas).
- **Pasos:**
  1. Intentar acceder al sistema usando `http://` (sin "s").
  2. Intentar acceder usando `https://`.
- **Resultado esperado:**
  - El acceso por HTTP es rechazado o redirigido automáticamente a HTTPS.
  - El navegador indica que la comunicación está cifrada (candado). En entorno de laboratorio puede indicar certificado no confiable, pero sí cifrado.
- **Riesgo OWASP asociado:** A02:2021 – Cryptographic Failures.

#### Caso 6.2 – Canal seguro para sockets de tiempo real
- **ID:** TC-RNF06-02
- **Objetivo:** Asegurar que las conexiones de tiempo real (Socket.IO) utilizan un canal cifrado.
- **Ámbito:** Comunicación en partidas en tiempo real.
- **Precondiciones:** Aplicación corriendo sobre HTTPS.
- **Pasos:**
  1. Establecer una partida entre dos navegadores.
  2. Verificar mediante herramientas del navegador (pestaña de red) que las conexiones de sockets usan `wss://` o están encapsuladas en HTTPS.
- **Resultado esperado:**
  - No se usan conexiones `ws://` o `http://` para datos sensibles de juego.
- **Riesgo OWASP asociado:** A02:2021 – Cryptographic Failures.

---

## RNF-07 – Protección básica contra fuerza bruta / DoS

### Descripción
El sistema debe implementar mecanismos para limitar el impacto de ataques de fuerza bruta y solicitudes excesivas desde un mismo origen.

### Riesgos OWASP relacionados
- A07:2021 – Identification and Authentication Failures
- A09:2021 – Security Logging and Monitoring Failures

### Casos de prueba propuestos

#### Caso 7.1 – Limitación de intentos de login
- **ID:** TC-RNF07-01
- **Objetivo:** Verificar que tras varios intentos fallidos de login el sistema aplica mecanismos de protección.
- **Ámbito:** Endpoint o flujo de login.
- **Precondiciones:** Mecanismo de conteo de intentos/rate limiting definido.
- **Pasos:**
  1. Desde la misma IP o usuario, realizar múltiples intentos de login con contraseña errónea (por ejemplo, 5–10 intentos seguidos).
  2. Observar la respuesta del sistema tras superar el umbral definido.
- **Resultado esperado:**
  - El sistema rechaza nuevas peticiones de login durante un tiempo o devuelve un mensaje de "demasiados intentos".
  - Opcional: se registra el evento en los logs.
- **Riesgo OWASP asociado:** A07:2021 – Identification and Authentication Failures.

#### Caso 7.2 – Límite de creación de salas
- **ID:** TC-RNF07-02
- **Objetivo:** Verificar que un usuario no puede crear salas ilimitadas en un periodo corto.
- **Ámbito:** Endpoint o flujo de creación de salas.
- **Precondiciones:** Mecanismo de control de frecuencia para creación de salas definido.
- **Pasos:**
  1. Autenticarse como un usuario válido.
  2. Intentar crear salas repetidamente en un corto periodo de tiempo (ejemplo: 20 solicitudes en unos segundos).
- **Resultado esperado:**
  - Tras superar un umbral, el sistema limita o rechaza nuevas creaciones de salas temporalmente.
  - El comportamiento queda registrado en los logs como posible abuso.
- **Riesgo OWASP asociado:** A07:2021 – Identification and Authentication Failures.

#### Caso 7.3 – Manejo de mensajes muy grandes
- **ID:** TC-RNF07-03
- **Objetivo:** Probar que el sistema no se ve afectado negativamente si un cliente envía mensajes de tamaño anormalmente grande.
- **Ámbito:** Formularios y mensajes por Socket.IO.
- **Precondiciones:** Servidor en ejecución.
- **Pasos:**
  1. Enviar un campo (por ejemplo, nombre o código de sala) con una longitud mucho mayor a la esperada (por ejemplo, 10.000 caracteres).
  2. Observar la respuesta del sistema.
- **Resultado esperado:**
  - El servidor rechaza el mensaje o lo trunca y devuelve un mensaje de error de validación.
  - El sistema no se cae ni afecta a otros usuarios conectados.
  - El evento se puede registrar como intento inválido (opcional).
- **Riesgo OWASP asociado:** A07:2021 – Identification and Authentication Failures.

---

## RNF-08 – Marco OWASP como "paraguas"

### Descripción
RNF-08 no es un requisito aislado, sino un marco que relaciona los RNF implementados con los riesgos del OWASP Top 10.

En el informe del proyecto, cada RNF y sus casos de prueba se pueden mapear a las categorías OWASP 2021, por ejemplo:

- **RNF-01** (validación y sanitización de entradas) → A03:2021 – Injection, A05:2021 – Security Misconfiguration.
- **RNF-02** (autenticación y sesión) → A01:2021 – Broken Access Control, A07:2021 – Identification and Authentication Failures.
- **RNF-05** (logging) → A09:2021 – Security Logging and Monitoring Failures.
- **RNF-06** (TLS) → A02:2021 – Cryptographic Failures.
- **RNF-07** (fuerza bruta/DoS) → A07:2021 – Identification and Authentication Failures, y apoyo en monitoreo (A09:2021).

De esta forma, los casos de prueba diseñados sirven también como evidencia de que el sistema aborda ciertos riesgos del OWASP Top 10.
