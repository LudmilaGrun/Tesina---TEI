# Selección de imágenes — pendiente de fuentes y aprobación

**No hay una selección definitiva de 20 imágenes aprobable todavía.** Ninguna muestra sin verificar se incorporó al juego. Los 20 archivos actuales son placeholders para probar el código y no sirven como estímulos de la tesina. No se generaron imágenes nuevas ni se usaron APIs pagas.

## Hallazgos comprobados

- Se consultó el README oficial de [OpenAI/DALL-E](https://github.com/openai/DALL-E/blob/master/README.md). El repositorio distribuye el VAE discreto, **no** el transformador de generación texto-imagen. Por tanto, no permite regenerar gratuitamente muestras auténticas de DALL·E 1 ni demuestra el origen de imágenes de terceros.
- Se consultó el [notebook oficial del Cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/dalle/Image_generations_edits_and_variations_with_DALL-E.ipynb). Documenta llamadas explícitas a DALL·E 3 y variaciones/ediciones con DALL·E 2, pero el notebook consultado no incluye un conjunto de 5 imágenes descargables de cada modelo con evidencia y permisos completos. No se ejecutó su API.
- Las consultas a `https://openai.com/index/dall-e/` devolvieron `403` del proxy (`CONNECT tunnel failed`), también al solicitar ejecución fuera del sandbox. La política efectiva del entorno solo permite dominios de gestores de paquetes; el borrador con los dominios de investigación no se aplicó al entorno actual.
- Las fuentes oficiales de presentación que faltan consultar son [DALL·E 1](https://openai.com/index/dall-e/), [DALL·E 2](https://openai.com/index/dall-e-2/) y [DALL·E 3](https://openai.com/index/dall-e-3/). Son puntos de búsqueda, **no** 15 imágenes ya verificadas ni una autorización de reutilización.
- No se ha comprobado todavía un conjunto suficiente de cinco muestras de DALL·E 1. Tampoco está completo el conjunto de las otras generaciones. Antes de sustituir cualquier generación, reducir cantidades o cambiar metodología, hace falta consultar a la autora.

## Fechas de referencia para documentar

| Modelo | Presentación anunciada (referencia a corroborar en las páginas primarias) | Distinción metodológica |
| --- | --- | --- |
| DALL·E 1 | 5 de enero de 2021 | No confundir el anuncio con la fecha de publicación del VAE en GitHub. |
| DALL·E 2 | 6 de abril de 2022 | La disponibilidad inicial fue restringida; no asignar modelo solo por fecha. |
| DALL·E 3 | 20 de septiembre de 2023 | La disponibilidad en productos ocurrió después del anuncio. |

Estas fechas no verifican ninguna imagen concreta. Se documentarán junto con fuentes primarias accesibles antes de completar la selección.

## Propuesta de selección, sin fijar imágenes aún

Usar cinco temas compartidos entre los cuatro grupos. Cada fila contendrá una fotografía real y una imagen de cada modelo:

| Tema | Fotografía real | DALL·E 1 | DALL·E 2 | DALL·E 3 |
| --- | --- | --- | --- | --- |
| Persona en una escena cotidiana | pendiente | pendiente | pendiente | pendiente |
| Animal | pendiente | pendiente | pendiente | pendiente |
| Objeto cotidiano | pendiente | pendiente | pendiente | pendiente |
| Paisaje natural | pendiente | pendiente | pendiente | pendiente |
| Espacio construido/interior | pendiente | pendiente | pendiente | pendiente |

Estos temas son una guía: se ajustarán a las muestras históricas auténticas disponibles, especialmente de DALL·E 1. No elegir solo ilustraciones caricaturescas de un modelo frente a imágenes fotográficas de otro; el estilo sería una explicación alternativa de los aciertos. La comparación no debe presentarse como una prueba causal aislada del progreso de los modelos.

## Evidencia requerida para cada candidato

1. Archivo visible para revisión y fuente original identificable, con su URL.
2. Autor o publicador y fecha documentada de creación/publicación; puede ser distinta de la fecha de presentación o disponibilidad pública del modelo.
3. Para IA, indicación explícita del modelo exacto asociada a ese archivo. “DALL·E” genérico, apariencia, fecha posterior al lanzamiento o un detector no bastan para asignar generación.
4. Fecha de presentación del modelo y, cuando corresponda, fecha de disponibilidad pública, documentadas con fuente primaria; aún deben revisarse antes de completar los registros.
5. Licencia o permiso que permita la reproducción en la web escolar sin pagar. “Está en Internet” no equivale a permiso. En fotografías de personas, revisar además las condiciones de uso y evitar datos identificatorios innecesarios.
6. Tema y estilo comparables, dimensiones originales, relación de aspecto y transformaciones declaradas. Preferir archivos cuadrados, marco y tamaño visual comunes; conservar originales. No recortar, retocar ni mejorar artefactos de un modelo sin aprobación y registro. El juego usa `object-fit: contain`, sin deformar ni recortar.
7. Hash SHA-256 del archivo seleccionado y aprobación explícita de la autora.

## Revisión previa a incorporación

Cuando se pueda acceder a las fuentes y completar la búsqueda, preparar una lámina/galería con los 20 archivos numerados, fuente, modelo, tema, dimensiones y licencia. Guardarla fuera de los archivos públicos del juego para que los participantes no vean las etiquetas. Presentarla a la autora y esperar aprobación antes de copiar imágenes definitivas al juego o marcar `approved: true` en `image-provenance.json`.

El control `npm run check:images` exige 20 IDs únicos, 5 imágenes por grupo, evidencia completa, archivo con hash coincidente y aprobación. Los hashes y la presencia de metadatos no sustituyen revisar la autenticidad ni los derechos. En el estado actual ese control debe fallar y bloquear la publicación del experimento con placeholders.
