# PLAN.md — KV editor, Motion, Now

Pasos 2, 3 y 5 de Szymon. Claude Code: revisalo con ojo crítico, corregí lo que esté mal, y frená para aprobación (PARADA 2 del prompt) antes de codear la app. El `sketch/index.html` es solo un boceto de la idea; no es la base sobre la que hay que construir (se puede leer como referencia de gesto y de layout 16:9 / 9:16).

## Cómo se construye de punta a punta

1. **App Vite + React 19 + TypeScript**, una sola página. Chrome de herramienta (oscuro, Archivo Narrow, sin dashboard): arriba formatos y acciones, centro el canvas de salida, derecha DialKit inline + lista de capas. Estado chico (composición activa, selección, formato, unidad de grilla, cell de pixelado) en un store simple o un reducer; el loop de preview no vive a 30 fps salvo cuando más adelante haya animación.
2. **Runtime de dibujo fuera de React.** Una función pura `render(ctx, composition, opts)` pinta el cuadro entero: papel y grano, grilla, cruces, capas en orden. React monta el canvas, maneja pointer y el overlay de edición de texto, y llama `render` cuando cambia el estado. El export PNG y (después) cada frame del MP4 usan la misma función.
3. **Modelo de composición en JSON versionado** (ver `SPEC.md`). Las capas son datos, no nodos de un editor genérico. Tipos cerrados: `block`, `bracket` (escuadra L), `headline` (Archivo Narrow + pixelado), `text` (limpio), `asterisk`, `lockup`. Papel, grilla y cruces son propiedades de la composición, no capas sueltas que se puedan borrar sin querer — aunque se pueden ocultar.
4. **Interacción:** selección, drag y resize con snap a la grilla, doble click para editar texto en un input HTML superpuesto (no en el canvas), diales para densidad de grilla, celda de pixelado, grano, color de la paleta cerrada. Atajos: V seleccionar, T texto, R rectángulo, backspace borrar, cmd/ctrl+D duplicar, cmd/ctrl+S guardar JSON, cmd/ctrl+E exportar PNG, 1–5 formatos. Los atajos no pelean con DialKit (ignorar keydown si el foco está en el panel o en un input).
5. **Presets de formato:** 16:9 (1920×1080), 4:5 (1080×1350), 9:16 (1080×1920), 1:1 (1080×1080), banner (1920×640). Cada uno trae un layout de partida (el 16:9 reconstruye el KV; el 9:16 parte de la jerarquía “Now” dominante). Al cambiar el formato se carga el layout de ese preset **o**, si el usuario ya editó, se pregunta: relayout del preset / adaptar la composición actual / cancelar. v1 no inventa un motor de layout automático perfecto.
6. **Export:** PNG del canvas de salida a resolución nativa del formato (y opción 2×). Guardar / abrir JSON de la composición. MP4 se deja encarado (Mediabunny + `render` por frame) pero no es fase 1.
7. **Fuentes:** Archivo Narrow local (OFL), `Bold` para titular y lockup wordmark, `Regular` o `SemiBold` si hace falta contraste. `document.fonts.load` antes del primer render. Nunca un fallback del sistema en un export.

## Dónde se contradice la idea

- **“Figma dedicado” vs. “no rehacer Figma”.** Si se abre la puerta a grupos anidados, auto-layout genérico, componentes, constraints de 12 tipos y booleanas, esto se vuelve un editor interminable. Resolución: tipos de capa cerrados y operaciones cerradas. Lo que no sea de este sistema va a `ideas.md`, no al código.
- **“Tipografía pixelada en vivo” vs. “texto editable”.** El bitmap no es un font nativo: no hay caret adentro de los píxeles. Resolución: el canvas muestra el bitmap; la edición es un overlay HTML con la misma métrica, y al confirmar se vuelve a pixelar. Ver el problema difícil más abajo.
- **“Grilla irregular como en el KV” vs. “snap predecible”.** Si cada línea tiene un lugar caprichoso, el snap es un infierno y los formatos no comparten grilla. Resolución: una unidad regular para snap y para las cruces; la *pinta* irregular (líneas que se cortan, columnas que se saltan, segmentos que atraviesan bloques) es una capa de dibujo encima, no el modelo de snap. Más adelante se pueden agregar guías manuales.
- **“Relayout por formato” vs. “no romper lo que el usuario acaba de acomodar”.** Resolución: presets de layout por formato + la pregunta de arriba. No un algoritmo mágico en v1.
- **“Paleta oficial” vs. “colores del PNG”.** El PNG está granulado y un poco corrido. Resolución: tokens oficiales + amarillo muestreado como default; preset opcional “match KV” con los hex medidos, documentado en `refs.md`.
- **“Puede vivir en el builder” vs. “la quiero ahora, sola”.** Resolución: se construye como app independiente con un `render(ctx, composition)` fácil de envolver después en un `Env`. No se bloquea por el contrato del builder, pero tampoco se inventa otra paleta ni otro export.

## Parte más riesgosa

Que el titular pixelado, el snap y el cambio de formato, juntos, se sientan de juguete: texto que no calza, celdas que “nadan” al mover, layouts 9:16 que no parecen de la misma familia. El riesgo no es técnico-imposible (todo esto entra en Canvas2D); es de oficio. Por eso el 16:9 de partida tiene que parecerse al KV (con la tipo nueva) y el 9:16 tiene que respetar las reglas del sistema, no solo encoger.

## Problema técnico más difícil

**Texto pixelado, editable en vivo, que pega a la grilla y se relaciona con los bloques, con el mismo aspecto en preview y en el PNG.**

Es el núcleo de la tool: si el titular se siente a medias (otra fuente, blur, celdas que no coinciden con la grilla, caret imposible, “Survey open” deformado), el resto no importa.

| Solución | Calidad | Velocidad | Trabajo | Riesgo | Costo de cambiar después |
|---|---|---|---|---|---|
| **A. Raster offscreen + umbral por celda** (el camino de `pixelText` / `KVBitmap`). Preview = bitmap. Edición = overlay HTML con la misma fuente y el mismo tamaño. Snap de la caja (x, y, y opcionalmente el tamaño) a la unidad de grilla. “Fit width” opcional, como el `fit` de KVBitmap, para calzar una palabra a un bloque. | Alta, y es exactamente el look tMSC ya usado | Alta si se cachea por `(text, font, size, cell, gap, color)` | Bajo–medio | Bajo (ya está probado en tools-diarias y post-studio) | Bajo: toda la pinta vive en `drawHeadline()` |
| **B. Atlas de glifos pre-pixelados** a un cuerpo fijo, como una bitmap font. | Muy estable a un solo cuerpo; floja cuando el usuario cambia el tamaño o el cell dial | Muy alta | Alto (hay que construir y cachear muchos cuerpos) | Medio (se nota el salto entre tamaños) | Alto |
| **C. Preview vectorial mientras se edita o se arrastra, pixelado solo al soltar o al exportar** | Editar es más cómodo | Alta en drag | Bajo | Alto: deja de ser WYSIWYG, que es el punto de una tool de este KV | Medio |

**Elección: A.** Es el método de producción que ya usa Esteban. El overlay de texto acepta que el caret no viva dentro de los píxeles. El fit a bloques es una acción explícita (“caber al ancho del bloque”), no un motor de layout. Si más adelante se quiere bleed (el de `bitmap.js`), se agrega adentro de `drawHeadline` sin tocar el modelo.

### Segunda decisión: modelo de grilla

| Solución | Calidad | Velocidad | Trabajo | Riesgo | Costo de cambiar |
|---|---|---|---|---|---|
| **A. Unidad regular para snap + dibujo irregular** | Alta en uso (el snap se entiende) | Alta | Bajo | Bajo | Bajo: se puede sumar un track list después |
| **B. Tracks explícitos tipo CSS grid** (lista de anchos y altos, como la grilla irregular del KV) | Más fiel al PNG original | Alta | Medio | Medio (re-layout y formatos) | Medio |
| **C. Guías sueltas al estilo Figma** | Flexible | Alta | Medio | Alto (se vuelve Figma) | Medio |

**Elección: A** en v1, con un dial de densidad que cambia la unidad (y cuántas subdivisiones se dibujan). B queda en `ideas.md`.

### Tercera decisión: relayout por formato

| Solución | Calidad | Velocidad | Trabajo | Riesgo | Costo |
|---|---|---|---|---|---|
| Coordenadas normalizadas 0–1 (estirar) | Baja (aplasta el tipo y el lockup) | Alta | Mínimo | Alto (rompe invariantes del lockup) | Bajo |
| **Presets de layout por formato, editables, guardados en JSON** | Alta si los presets están bien diseñados | Alta | Medio (hay que diseñar 5 composiciones de partida) | Bajo | Bajo |
| Motor de constraints / auto-pack | Ambiciosa | Media | Alto | Alto | Alto |

**Elección: presets por formato.** El 16:9 reconstruye el KV. El 9:16 usa la jerarquía del prompt vertical. Los otros tres se diseñan a mano con las mismas reglas. El lockup se mueve y se escala de forma uniforme (por altura), nunca se estira.

## Qué tiene que quedar igual (paso 5) — invariantes

- Paleta cerrada. Nunca `#0000FF` ni `#3D3DEB`. Nunca un color que no esté en los tokens o en el preset “match KV”.
- Amarillo de fondo plano, con grano opcional. Sin degradé, sin sombra, sin glow, sin 3D, sin foto.
- Titular en Archivo Narrow Bold, pixelado nivel 2 (celda 6 a 1080 de ancho, escalable, hard edges). Solo las capas `headline` se pixelan. Lockup y `text` se quedan nítidos.
- Un asterisco como máximo. Una escuadra L como máximo.
- El lockup es un módulo intacto: tres partes, orden fijo, no se parte, no se restylea, no se estira en un solo eje, el wordmark no se pixela.
- Snap a la unidad de grilla en move/resize. El aire amarillo es válido; no rellenar por inseguridad.
- Mismo `render(ctx, composition)` para preview, PNG y (después) cada frame de MP4. Sin `Date.now()` ni `Math.random()` sin semilla adentro del render (el grano usa una semilla de la composición).
- JSON de composición versionado, como en `SPEC.md`. Abrir un archivo viejo tiene que migrar o rechazar, no corromperse.
- Sin labels en mayúsculas con cuadradito naranja. Sin íconos decorativos fuera del ícono del lockup.
- El boceto `sketch/index.html` no es la app: no copiar su estructura como arquitectura. Sí se pueden tomar medidas, layouts de partida y el gesto de edición.

## Orden sugerido (fases)

1. **Paradas 1 y 2** del proceso: leer refs, acordar este plan. Sin código de la app.
2. **Core:** modelo + `render()` + canvas + paleta + papel/grano/grilla/cruces. Un 16:9 estático que se parezca al KV (con Archivo Narrow pixelado) y se exporte a PNG.
3. **Edición:** selección, drag/resize con snap, lista de capas, edición inline de texto, diales (densidad, celda, grano), paleta sobre el bloque seleccionado.
4. **Formatos:** presets 4:5, 9:16, 1:1, banner, con layouts de partida y la pregunta al cambiar.
5. **Archivo:** save/load JSON, deshacer básico, atajos, pulido del lockup (anillo con corte, ícono outline).
6. **Después (ideas.md):** MP4 / animación, fit automático a bloque, tracks de grilla, más de un documento, enchufe al builder.

Estimación honesta: fases 2–5 son unos pocos días de sesiones con Claude Code, no una tarde, porque el oficio del 9:16 y del lockup va a pedir vueltas. El boceto sirve para no partir de cero en el gesto, no para ahorrarse esas vueltas.
