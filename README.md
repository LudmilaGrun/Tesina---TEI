# ¿REAL O IA? — alojamiento gratuito

Aplicación de tesina escolar con 20 imágenes aleatorias (5 fotografías reales y 5 de cada generación DALL·E 1, 2 y 3), edad e ID anónimo, panel privado `/admin`, gráfico de detección por modelo y CSV con una fila por respuesta. La versión vigente usa **Cloudflare Workers Free + D1 Free**, con archivos estáticos locales. No necesita Render, un dominio comprado, APIs de generación pagas, almacenamiento R2 ni tarjeta.

## Estado real

La aplicación funciona en el runtime local de Cloudflare. Se probaron 15 participantes independientes y 300 respuestas, además de un participante 16 sin límite de acceso, acceso privado, CSV, y una partida completa en Chromium móvil. Los datos de prueba están en directorios temporales nuevos `/tmp/real-ia-20-tests-*`, separados de la base local habitual. **Todavía no hay enlace público**, ni base remota creada: hace falta una cuenta gratuita de Cloudflare conectada de forma segura. Las 20 imágenes siguen siendo placeholders; no son muestras auténticas de DALL·E y no se deben usar para recopilar datos reales.

La versión anterior de Flask y su base local se preservaron en `/workspace/real-ia-flask-backup`. No se borraron sus datos. La versión vigente no los importa automáticamente; no había partidas reales de participantes en esa base durante la configuración inicial.

## Costo cero y límites

Usá exclusivamente **Workers Free**. No actives Workers Paid, suscripciones, pruebas pagas, R2 ni un dominio comprado. Si alguna pantalla pide una tarjeta o propone pagar, detené ese paso.

La documentación oficial consultada indica:

- Workers Free: 100.000 solicitudes dinámicas por día; los archivos estáticos tienen solicitudes gratuitas e ilimitadas.
- D1 Free: 5 millones de filas leídas/día, 100.000 filas escritas/día y 5 GB de almacenamiento total por cuenta, sujetos también a los límites por base.
- Al agotar la cuota gratuita de D1, las consultas fallan; no se cobra automáticamente una ampliación. El límite diario se restablece al día siguiente. El almacenamiento lleno requiere liberar espacio, nunca pagar sin autorización.

Son límites de la cuenta, compartidos con otros proyectos. Una partida usa varias solicitudes y escrituras; estos números no equivalen a cantidad de participantes. Para esta tesina debería alcanzar, pero hay que mirar el uso. No puedo prometer que un proveedor mantenga sus condiciones para siempre. No existe una configuración que autorice gastos futuros en este proyecto.

Fuentes oficiales: [Workers](https://developers.cloudflare.com/workers/platform/pricing/) y [D1](https://developers.cloudflare.com/d1/platform/pricing/). Ante el bloqueo de acceso directo, se consultaron sus textos en el [repositorio oficial de documentación](https://github.com/cloudflare/cloudflare-docs), incluyendo la respuesta sobre cuotas agotadas de D1.

## Lo que necesitás hacer para que yo pueda publicar

1. Creá tu cuenta en Cloudflare, verificá el correo y mantené Workers en el plan **Free**. No ingreses datos de pago.
2. En el perfil de Cloudflare, creá un token de API limitado a tu cuenta con permisos **Workers Scripts: Edit**, **D1: Edit** y los permisos de lectura de cuenta necesarios para identificarla. Conservá el token privado.
3. En la configuración segura de este entorno, completá el requisito **CLOUDFLARE_API_TOKEN**, destinado a `api.cloudflare.com`. No lo pegues en el chat. Agregá **CLOUDFLARE_ACCOUNT_ID** con el ID de tu cuenta (no es una contraseña).
4. Revisá y guardá los cambios de red para permitir el API de Cloudflare y las fuentes de imágenes. Guardar el borrador no hace el despliegue por sí mismo.

Después puedo crear D1, aplicar el esquema, configurar los secretos y publicar. La autorización para publicar ya fue dada; no requiere contratar nada. Si los permisos exactos del token resultan insuficientes, se diagnosticará la operación fallida antes de pedir más acceso. No compartas una Global API Key.

## Pasos de publicación, para quien haga el despliegue

Desde este checkout, después de verificar cuenta gratuita, acceso e imágenes:

```bash
npm ci
npx wrangler d1 create real-o-ia-results
```

Copiá el ID de la base creada al campo `database_id` en `wrangler.jsonc`; el ID de ceros es solo para desarrollo. Luego:

```bash
npm run db:remote
npm run deploy
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_PASSWORD
```

`SESSION_SECRET` debe ser aleatorio, largo y estable; `ADMIN_PASSWORD` es la contraseña privada que elegirás para el panel. Cargalos de forma segura, nunca en Git ni en el chat. Mientras no estén configurados, los endpoints quedan cerrados. Las cookies usan HTTPS, HttpOnly y SameSite estricto; las sesiones vencen a las dos horas. El código no envía etiquetas ni respuestas correctas al participante durante el juego.

Wrangler mostrará el enlace HTTPS `workers.dev` asignado. Ese es el enlace que vas a mandar a los participantes; no se inventa antes del despliegue. Antes de compartirlo, comprobar una partida de prueba, `/admin` y CSV en la web pública. Las pruebas locales no verifican por sí solas la base remota.

## Imágenes verificadas

El conjunto debe contener 5 fotografías reales y 5 muestras auténticas de cada uno de DALL·E 1, 2 y 3. El nombre del archivo, la apariencia y la opinión de un detector no demuestran qué modelo generó una imagen.

- Archivos: `public/static/images/`, usando nombres neutros que no revelen el modelo.
- Clasificaciones privadas: `images.json`, con `id`, `imageUrl`, `correctAnswer`, `model` y `generationLevel`.
- Procedencia: `image-provenance.json`, con URL de origen, autor, licencia/permiso, evidencia de fotografía/modelo y SHA-256 del archivo.

Las fotografías deben tener un origen comprobable; las imágenes IA deben tener evidencia explícita del modelo exacto. Para muestras oficiales, también debe verificarse el permiso de reutilización: que una imagen sea pública no implica una licencia libre. Solo se incorporarán fuentes utilizables sin pagar. No se genera una imagen con un modelo nuevo para etiquetarla como DALL·E 1 o 2.

`npm run check:images` impide publicar el experimento mediante `npm run deploy` mientras falten los 20 archivos y registros verificados y tu aprobación explícita (`approved: true`). Este control confirma registros y hashes; la autenticidad y los permisos requieren revisión de las fuentes, no se deducen automáticamente. No marques `verified` sin comprobarlos. Si no se consiguen suficientes muestras auténticas y reutilizables gratuitamente, se consultará una alternativa antes de cambiar el experimento.

No cambies el conjunto a mitad del estudio. Cada partida guarda su clasificación original en D1.

## Dónde se guardan los resultados y cómo descargar el CSV

En producción, quedan en **D1**, en tu cuenta de Cloudflare. Todos los celulares y computadoras usan la misma base del servidor; no se guardan solamente en el navegador y no desaparecen al reiniciar un Worker. Se guarda cada respuesta inmediatamente. Al completar las 20, una operación de base de datos actualiza puntaje, porcentaje y estado completo.

Entrá al enlace público seguido de `/admin` e ingresá tu contraseña. Verás participantes, aciertos generales, aciertos con fotografías reales, detección correcta por modelo, gráfico y detalles anónimos. No interpreta automáticamente la hipótesis.

Para el gráfico, presioná **DESCARGAR GRÁFICO PNG**: genera un archivo de 1800×1200 con eje de 0 a 100%, denominadores y cantidad de participantes, apto para insertar en la tesina. El panel también muestra porcentaje de aciertos y errores por imagen. No interpreta tu hipótesis.

Presioná **EXPORTAR CSV**. El archivo tiene las diez columnas solicitadas más `total_images` y `experiment_version`, para separar partidas de 12 y 20 imágenes y una fila por respuesta. Las fechas están en UTC; `real` significa fotografía y `ai`, generada con IA. Usa UTF-8 con BOM para Excel. En Google Sheets importalo con separador coma.

Panel y CSV incluyen solo partidas completas. Las partidas históricas se conservan con su total original; las estadísticas del estudio actual solo usan la versión `study-20-v1`, para no mezclar metodologías. No hay límite de 15 participantes: esa es la meta inicial. Las incompletas permanecen en la base pero no afectan porcentajes. Descargá CSV periódicamente como respaldo gratuito. No registres partidas de prueba junto con participantes reales y nunca borres datos sin una copia previa.

No se guardan nombre, apellido, correo, teléfono, ubicación ni IP en las tablas. La observabilidad del Worker está desactivada; el proveedor puede manejar metadatos técnicos conforme a su política, fuera de las tablas del experimento.

## Desarrollo y pruebas

Usá el checkout existente; no crees un worktree. Node.js y npm:

```bash
npm ci
node scripts/setup-local.mjs
npm run db:local
npm run dev
```

Necesitás `.dev.vars` (ignorado por Git) con `SESSION_SECRET` y `ADMIN_PASSWORD` para desarrollo. No reutilices las contraseñas de producción. El entorno actual ya tiene secretos locales generados, sin imprimirlos ni guardarlos en Git.

Para pruebas sin contaminar la base del experimento:

```bash
npm test
```

Este comando crea una base temporal nueva y un servidor local en un puerto libre; prueba la migración de partidas anteriores, 15 participantes con 300 respuestas, un participante 16 adicional, estadísticas, CSV y un recorrido en Chromium móvil con descarga PNG. Al terminar detiene solo el servidor de pruebas. Los artefactos quedan en el directorio temporal que informa la ejecución. Si existe `/usr/bin/chromium`, lo usa automáticamente; en otras máquinas podés instalar el navegador de Playwright con `npx playwright install chromium` o indicar `CHROMIUM_BIN`.

`npm run test:api` y `npm run test:browser` son comandos internos contra un servidor local de pruebas ya iniciado; no usarlos contra datos reales. `npm test` es la opción segura y reproducible.

Ver [estado y validación](docs/estado-y-validacion.md) y [selección de imágenes](docs/seleccion-imagenes.md). La selección definitiva y la aprobación de las 20 imágenes siguen pendientes; las pruebas actuales son con placeholders y no sustituyen las pruebas finales de la web publicada.
