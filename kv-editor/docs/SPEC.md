# SPEC.md — KV editor, Motion, Now

Contrato de datos y de dibujo para la app. Si el código y este archivo divergen, se actualiza los dos en el mismo cambio. Coordenadas en píxeles del formato (no CSS, no normalizadas). Origen arriba-izquierda, Y crece hacia abajo.

## 1. Formatos

| id | nombre | width | height | uso |
|---|---|---|---|---|
| `16x9` | horizontal | 1920 | 1080 | layout maestro (el KV original es 2816×1584, mismo ratio; acá se trabaja a 1920×1080) |
| `4x5` | post | 1080 | 1350 | Instagram / default tMSC |
| `9x16` | stories / vertical | 1080 | 1920 | jerarquía “Now” dominante |
| `1x1` | cuadrado | 1080 | 1080 | |
| `banner` | banner ancho | 1920 | 640 | |

El canvas de salida *es* ese tamaño. El preview lo escala con CSS o `setTransform` para que quepa, pero `render` siempre pinta en píxeles nativos (o en `scale` 2 para un PNG @2x, multiplicando también la celda).

## 2. Paleta

Tokens default (cerrados):

```
paper    #F6E95B    # amarillo muestreado del KV (no es #E4FC24)
pink     #F06CCC
lilac    #CC84FC
green    #0C540C
brown    #3C240C
ink      #0C0C0C
white    #FFFFFF    # solo en el módulo izquierdo del lockup
grid     #8A7A28    # oliva de las líneas y las cruces; no tinta
```

Preset opcional `match-kv` (medianas del PNG, con grano): paper `#F6E95B`, pink `#FB83BD`, lilac `#BFA3EF`, green `#074517`, brown `#3C2A14`, ink `#131212`.

Prohibidos: `#0000FF`, `#3D3DEB`, cualquier otro hex, degradés, alpha decorativo en bloques (el grano del papel sí puede variar el amarillo alrededor del token).

## 3. Documento JSON

```ts
type FormatId = "16x9" | "4x5" | "9x16" | "1x1" | "banner";

interface Composition {
  version: 1;
  id: string;               // uuid
  name: string;             // "Motion, Now — 16:9"
  format: FormatId;
  width: number;
  height: number;
  seed: number;             // grano y cualquier irregularidad de grilla
  palette: "official" | "match-kv";
  paper: { color: string; grain: number };   // grain 0–1, default 0.12
  grid: {
    visible: boolean;
    crosshairs: boolean;
    unit: number;           // px, múltiplo entero ≥ 4
    density: number;        // 0–1, afecta qué subdivisiones se dibujan
  };
  pixel: {
    cellAt1080: number;     // default 6
    gap: boolean;           // default false (celdas sólidas, como el nivel 2 publicado); true pinta cell-1, como pixelate() de some tools-diarias
    threshold: number;      // 0–255, default 128 para alpha; 110 si se usa cobertura tipo KVBitmap
  };
  layers: Layer[];          // atrás → adelante
}

type Layer =
  | BlockLayer
  | BracketLayer
  | HeadlineLayer
  | TextLayer
  | AsteriskLayer
  | LockupLayer;

interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}
```

Campos por typo:

```ts
interface BlockLayer extends LayerBase {
  type: "block";
  x: number; y: number; w: number; h: number;
  fill: string;            // un token
}

interface BracketLayer extends LayerBase {
  type: "bracket";         // escuadra L, máx. una visible
  x: number; y: number; w: number; h: number;
  thickness: number;       // ancho de la pata y de la barra, en px
  corner: "ne" | "nw" | "se" | "sw";  // el KV usa "ne"
  fill: string;
}

interface HeadlineLayer extends LayerBase {
  type: "headline";        // siempre Archivo Narrow Bold + pixelado
  text: string;
  x: number; y: number;    // ancla: izquierda, baseline alfabética
  size: number;            // px de font-size
  fill: string;            // normalmente ink
  tracking: number;        // em, default 0
}

interface TextLayer extends LayerBase {
  type: "text";            // limpio, sin pixelar (copy de apoyo, fechas)
  text: string;
  x: number; y: number;
  size: number;
  weight: 400 | 600 | 700;
  fill: string;
  tracking: number;
}

interface AsteriskLayer extends LayerBase {
  type: "asterisk";        // máx. uno visible
  x: number; y: number;    // centro
  size: number;            // diámetro de la caja
  rotation: number;        // grados, el KV está casi a 0
  fill: string;            // brown
}

interface LockupLayer extends LayerBase {
  type: "lockup";
  x: number; y: number;    // esquina superior izquierda del módulo blanco
  h: number;               // altura; el ancho se calcula (no es un campo libre)
  // wordmark fijo: "Motion Social Club". No hay campo de texto.
}
```

Reglas: no hay grupo genérico. Si hace falta “el lockup y el bloque que lo sostiene”, se mueven juntos como selección múltiple, no como un tipo nuevo. `width`/`height` del documento tienen que coincidir con el formato. Al guardar, se escribe `version: 1`. Si un día hay `version: 2`, el loader migra o rechaza con un error claro.

## 4. Grilla y snap

- La unidad de snap es `grid.unit`. Toda operación de move/resize de `x, y, w, h, size` (este último en headlines, redondeado) termina en múltiplos de `unit`, salvo el `h` del lockup (se snapea) y su `w` derivado, y salvo `rotation`.
- Mientras se arrastra, el preview también va snapeado (no hay estado “a medio snap” que se corrija al soltar: evita que las celdas del titular “naden”).
- `density` no cambia el snap. Cambia el dibujo: a densidad baja se ven sobre todo las líneas cada 4 unidades; a densidad alta, cada unidad, con algunas cortadas.
- Irregularidad (semilla `seed`): se omiten segmentos, se alargan otros, algunas líneas cruzan bloques y se dibujan *encima* de ellos (como en el KV). No se mueven los puntos de snap.
- Cruces “+”: en una serie inset (margen ≈ 6 % del lado corto, o un múltiplo de `unit` cercano), ritmo regular. 16:9: 5×4 como el original. 9:16: más filas. Trazo hairline, mismo color `grid`, no tinta.
- Hairline: 1 px a 1080 de ancho; `max(1, round(width / 1080))` en formatos más anchos.

## 5. Pixelado del titular (nivel 2)

Única función: `drawHeadline(ctx, layer, composition)`. Preview y export la llaman igual.

Algoritmo (el de `pixelText` en `creative-practice/tools-diarias/shared/base.js`):

1. Calcular `cell = max(2, round(pixel.cellAt1080 * composition.width / 1080))`. En 1920×1080 con default 6, cell = 11. En 1080 de ancho, cell = 6.
2. Medir el texto con `font = "700 {size}px 'Archivo Narrow'"`, baseline alphabetic, tracking aplicado vía `letterSpacing` si está disponible o dibujando glifo a glifo.
3. Rasterizar en un canvas offscreen con padding de `2 * cell`, fill sólido negro sobre transparente, **sin** smoothing especial (sí el AA default del raster de fuente: el umbral de la celda se encarga).
4. Para cada celda de la grilla del offscreen, muestrear el **centro**. Si `alpha >= threshold` (default 128), pintar un rectángulo de lado `gap ? cell - 1 : cell` en el color `fill`, anclado a la grilla del offscreen. El default es `gap: false`: celdas que se tocan, letra sólida con escalones, como en las refs de nivel 2 de post-studio (`pixel-level2-contact-sheet.png`). `gap: true` deja una línea de 1 px y se ve más a trama; no es el look de esas piezas.
5. `drawImage` del offscreen en `(x - pad, y - pad - ascent)` sobre el canvas de salida. No volver a escalar con smoothing. No blur, no SVG filter en el default.
6. Cachear por clave `(text, size, tracking, cell, gap, threshold, fill, width)`. Invalidar al editar.

La grilla de celdas del bitmap es la del offscreen (origen en la esquina del padding), no necesariamente la grilla de layout. Alinear las celdas del titular a la grilla de layout es un plus (si el ancla `(x, y)` se snapea y el padding es múltiplo de `cell`, queda más quieto). Hay que intentarlo; si complica el baseline, se documenta y se deja para después, no se “casi alinea”.

Texto de `text` y del lockup: `fillText` directo, `imageSmoothingEnabled` irrelevante, sin pasar por este pipeline.

## 6. Lockup

Se dibuja como un solo objeto a partir de `h`:

- Módulo blanco: cuadrado `h × h`. Anillo negro con un **corte abajo** (arco que no cierra, como en `refs/lockup-crop.png`) y una “M” grotesca centrada, tinta, sin pixelar.
- Pastilla lila: altura `h`, ancho el del wordmark más padding horizontal (~0.28 h a cada lado). Wordmark “Motion Social Club” en Archivo Narrow Bold (o SemiBold si el Bold tapa el anillo), tinta, cuerpo ≈ 0.42 h, centrado verticalmente.
- Módulo rosa: cuadrado `h × h`. Ícono outline (fantasma / nube del recorte), trazo tinta, sin relleno, centrado. No reemplazar por otro pictograma.
- Los tres módulos se pegan, sin huelgo. Ancho total = `2h + anchodelilac`. Ese ancho no se edita. Resize = cambiar `h` (snap) y recalcular.
- Nunca rotar, nunca invertir el orden, nunca pixelar.

## 7. Asterisco y escuadra

- Asterisco: seis brazos iguales, extremos rectos o levemente romos, no una estrella de cuatro puntas ni un `*` de sistema sin redibujar. Se pinta en canvas (path), no como carácter de una fuente, para que la rotación y el tamaño sean limpios. Máximo uno con `visible: true`.
- Escuadra: rectángulo recortado (barra + pata) según `corner` y `thickness`. Máximo una visible. Esquinas vivas.

## 8. Papel y grano

Llenar de `paper.color`. Si `grain > 0`, variar cada píxel (o un tile de ruido 256×256 repetido con `multiply` / offset) con una función determinada por `seed`, amplitud proporcional a `grain` (en el KV el desvío real es ≈ 2/255). Nada de textura fotografiada.

## 9. Orden de dibujo

1. Papel + grano.
2. Bloques y escuadra (orden de `layers`).
3. Grilla (visible encima de los bloques, hairline; en el KV se ve sobre el rosa, el lila y el verde).
4. Cruces.
5. Headlines, textos, asterisco, lockup, en el orden de `layers`.

La grilla es un overlay de composición, no una capa que el usuario reordene en v1 (sí se puede ocultar). Las cruces igual.

## 10. Interacción (contrato, no UI)

- Hit-test de adelante hacia atrás, respetando `visible`. `locked` se puede seleccionar pero no mover.
- Drag mueve `x, y` (el asterisco, su centro). Resize: 8 handles en bloques / escuadra; en headline cambia `size` (esquina) manteniendo baseline; en lockup cambia `h`; en asterisco, `size`.
- Doble click en `headline` o `text`: overlay `<input>` o `<textarea>` posicionado en coordenadas de pantalla, misma fuente y tamaño aproximado (el overlay puede ser vectorial; el canvas debajo se puede ocultar esa capa un momento o dejar el bitmap hasta confirmar). Enter confirma, Esc cancela.
- Lista de capas: visibilidad, lock, orden (arrastrar), borrar, duplicar.
- Agregar: bloque (de la paleta), headline, text, asterisco (si no hay uno visible), lockup (si no hay uno), escuadra (si no hay una).
- Paleta: click en un swatch recolorea la capa seleccionada si acepta `fill`. El papel tiene su propio control. No hay color picker libre.

## 11. Persistencia y export

- Guardar: `JSON.stringify(composition)` con nombre `{name}.json`. Cargar: parsear, validar `version` y tipos, rechazar colores fuera de paleta, recalcular `width/height` desde `format`.
- PNG: `render` a un canvas del tamaño del formato (o ×2), `toBlob('image/png')`, descargar. El overlay de UI no entra. El texto en edición se confirma antes.
- MP4 (después): `render` por frame, `t` en segundos, timeline en un campo futuro de la composición. Mux con Mediabunny, H.264, yuv420p, 30 fps. Nunca GIF. Hasta que exista, no agregar un encoder “provisional”.

## 12. Layouts de partida

Van como JSON en `/presets/` (uno por formato), no hardcodeados en componentes de UI. El de `16x9` reconstruye el KV con las proporciones medidas en `refs.md` (escala 1920/2816). El de `9x16` usa titular en dos líneas, “Motion,” arriba más chico, “Now” dominante, grilla más densa, asterisco cruzando un borde de bloque, lockup abajo a la izquierda sobre un bloque, aire amarillo. Los otros tres se diseñan a mano con las mismas reglas. El boceto puede usarse como primer tiro, pero hay que revisarlo en pantalla.

## 13. Fuera de alcance v1

Animación, multi-página, auto-fit continuo, tracks de grilla, color picker libre, grupos anidados, tipografías que no sean Archivo Narrow, generación con IA.
