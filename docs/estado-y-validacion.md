# Estado de la versión de 20 imágenes

## Implementado

- Continúa el proyecto existente; conserva diseño oscuro y verde lima.
- 20 imágenes: cinco por grupo, en orden aleatorio por participante, sin límite de 15 participantes.
- Solo pide edad. Respuestas correctas y modelo permanecen en el servidor durante el juego.
- Cada partida guarda su total y versión de estudio. La migración conserva datos, puntajes y porcentajes de partidas anteriores de 12 imágenes; las incompletas anteriores pueden terminar con su denominador original.
- Panel privado: total histórico, cantidad del estudio actual, porcentaje general, fotografías reales y cada generación, detalles individuales y aciertos/errores por imagen.
- Gráfico de barras 0–100%, sin interpretar la hipótesis, descargable como PNG de 1800×1200 con denominadores y cantidad de participantes.
- CSV con las diez columnas originales y dos columnas adicionales `total_images` y `experiment_version` para identificar estudios distintos. Conserva partidas históricas completas. Las incompletas se guardan pero no entran en estadísticas ni CSV.
- Los porcentajes y el gráfico del estudio actual no mezclan partidas históricas de 12 imágenes.

## Verificado localmente

`npm test` crea una base D1 temporal nueva y levanta el runtime local de Workers. No usa ni borra bases del experimento. En la ejecución:

- Prueba de migración: conserva participantes/respuestas anteriores, permite terminar una partida anterior de 12, y no termina una nueva a las 12 respuestas; calcula 12/20 = 60% correctamente.
- Prueba de API: 15 participantes completos → 300 respuestas y CSV con 300 filas. Permite completar también al participante 16.
- Verifica edad válida, orden aleatorio sin repetir imágenes, rechazo de respuestas fuera de orden o duplicadas, ausencia de etiquetas/correcciones en respuestas del juego, sesión incompleta excluida, estadísticas por modelo e imagen, acceso privado, CSV y cierre de sesión.
- Prueba de Chromium móvil (390×844): EMPEZAR, las 20 imágenes, resultado 5/20 al responder siempre REAL, las 20 respuestas en el panel, CSV, descarga PNG de 1800×1200, cierre de sesión y ausencia de errores JavaScript/desborde horizontal. También captura el panel de escritorio.
- Instalación y migraciones se repiten sin borrar datos. Los respaldos anteriores a los cambios se guardaron en `/workspace/real-ia-backups`, fuera del checkout.

Las pruebas usan placeholders y datos ficticios. **No son la validación final con imágenes aprobadas ni del servicio publicado.** El PNG de muestra en `/workspace/real-ia-review/grafico-datos-ficticios.png` no contiene resultados de adolescentes y no debe presentarse como datos de la tesina.

## Pendiente / bloqueado

1. No hay conjunto suficiente de imágenes auténticas, utilizables gratuitamente y aprobadas. Ver `seleccion-imagenes.md`.
2. La sesión actual no tiene credenciales de Cloudflare ni sus dominios habilitados. El estado efectivo del entorno confirma cero secretos y cero variables inyectadas. Que existan requisitos en un borrador no los vuelve operativos.
3. El ID de D1 en `wrangler.jsonc` sigue siendo el marcador local de ceros. No se verificó ni creó una base remota.
4. No se publicó una web ni hay enlace público comprobado. Antes de publicar deben completarse acceso, verificación del plan Free, imágenes/aprobación, creación o identificación de D1 y respaldo previo a cualquier migración remota.
5. Después del despliegue, repetir las pruebas finales en la web real sin mezclar los datos de prueba con los datos reales.

No se contrató ningún servicio, no se habilitó ningún plan pago y no se ingresaron datos de pago. Se mantiene Cloudflare Workers Free + D1 Free como objetivo de despliegue. La autorización para publicar gratuitamente ya está dada; no hace falta volver a pedirla, pero no reemplaza el acceso efectivo a la cuenta.

## Diagnóstico del guardado de Codex

Al intentar guardar las instrucciones nuevas, la herramienta devolvió `CONFLICT / stale_base`: la configuración se publicó o cambió después de crearse el borrador vinculado a este chat. La respuesta indica que leer y reenviar el mismo borrador no lo corrige. Por eso el guardado de las instrucciones actualizadas **no se confirmó**. El estado del runtime de este chat puede ser anterior a los valores que se hayan guardado en otra versión.

Se preservó el código completo y la configuración propuesta, sin tokens ni datos de participantes, en `/workspace/real-ia-review/real-o-ia-20-transfer.zip`. Para continuar hay que iniciar un chat nuevo de configuración desde los ajustes actuales del entorno, adjuntar ese ZIP y reconciliar la configuración con su borrador nuevo. No se debe depender de que el nuevo chat reciba este workspace ni pedir nuevamente credenciales sin inspeccionar sus bindings actuales.
