# refs.md — KV editor, Motion, Now

Paso 1 de Szymon. Cada referencia tiene qué tomar y qué ignorar. Si Claude Code lee mal el KV, corregilo antes de cualquier código.

## 1. El key visual maestro

Archivo: `refs/kv-main.png` (original 2816×1584, 16:9 exacto). Vista más liviana: `refs/kv-main-half.png`. Recortes: `refs/lockup-crop.png`, `refs/asterisk-crop.png`.

Fuente: el KV que Esteban trajo el 17/11/2026 como “main key visual” de la campaña, después de trabajar con PLNTY y Flora. Es la referencia de sistema, no una imagen para calcar píxel a píxel.

### Qué se ve (medido sobre el PNG)

- **Fondo:** amarillo papel cálido, plano, con grano de impresión. Mediana en el margen superior: `#F6E95B` (246, 233, 91). Desvío del grano ≈ 2 unidades por canal. No es el ácido tMSC `#E4FC24`. Nunca hay degradé ni brillo.
- **Grilla:** líneas pelito, color oliva oscuro (no negro; una muestra sobre amarillo anda alrededor de `#B3A040`–`#8A7A28`), de 1–2 px a 2816 de ancho. Es modular e irregular, como una grilla de armado o una hoja de cálculo: columnas de anchos distintos (en la zona superior se midieron verticales en x 1010, 1195, 1398, 1525, 1584, 1728: pasos de 59 a 203 px). Algunas líneas se cortan o atraviesan los bloques y siguen visibles encima.
- **Cruces “+”:** marcas de registro chicas, finas, del mismo color que la grilla. En 16:9 hay una serie regular inset: cinco en x (111, 762, 1406, 2056, 2703) y cuatro en y (91, 563, 1014, 1490), más visibles en los márgenes. Son quietas, no son decoración.
- **Bloque rosa:** rectángulo plano a la izquierda, aprox. x 140–939, y 451–1215. Mediana muestreada `#FB83BD`. El token oficial de la campaña es `#F06CCC`.
- **Bloque lila:** a la derecha del rosa, un poco más abajo y más largo, aprox. x 864–1685, y 548–1344, y se estira debajo para sostener el lockup (hasta x 1849 en esa franja). Mediana `#BFA3EF`. Token oficial `#CC84FC`. Los dos bloques se pisan en el borde. Esquinas vivas, sin sombra ni trazo.
- **Escuadra verde:** una L, un solo acento estructural. Barra superior aprox. x 1928–2675, y 245–406; pata derecha x 2479–2674, y 245–1004. Mediana `#074517`. Token oficial `#0C540C`. Máximo una escuadra por composición.
- **Titular “Motion, Now”:** muy grande, tinta casi `#0C0C0C` / `#131212`, una sola línea (en el KV) que cruza rosa, lila y el vacío amarillo. La “o” de Motion y la de Now tienen recortes de stencil. Esto es lo que **no** hay que copiar (ver más abajo). Altura de la palabra “Motion,” ≈ 497 px a 2816 de ancho.
- **Asterisco:** uno solo, marrón, de seis brazos gruesos con extremos algo romos, como recortado a mano. Caja aprox. x 2245–2606, y 981–1391. Se mete un poco debajo de la pata verde y cruza la grilla. Mediana `#3C2A14`. Token oficial `#3C240C`. Puede rotar un poco y cambiar de lugar y escala. Nunca dos.
- **Lockup:** barra horizontal intacta, abajo a la izquierda del bloque lila, nunca flotando en el amarillo desnudo en este KV. Tres módulos pegados, altura ≈ 130 px: (1) cuadrado blanco ≈ 135×130 con un anillo negro que tiene un corte abajo del todo y una “M” grotesca adentro; (2) pastilla lila con “Motion Social Club” en grotesca negra limpia, no stencil; (3) cuadrado rosa ≈ 140×130 con un ícono outline que parece un fantasma / nube / copa, trazo negro grueso. El lockup no se estira, no se parte, no se redibuja. Puede moverse, siempre alineado a la grilla, siempre sobre un bloque de color.

Jerarquía visual: titular > bloques > asterisco > lockup > grilla > cruces. El amarillo vacío es parte del diseño: hay mucho aire arriba y abajo.

### Tomar

La lógica de sistema: papel amarillo con grano, grilla de construcción, cruces de registro, bloques planos que sostienen las palabras, un asterisco como ancla, el lockup como firma, aire, bleed de elementos fuera del encuadre, sensación de impreso / herramienta / hoja de cálculo, no de póster “bonito”.

### Ignorar

- **La tipografía stencil con counters recortados.** Esteban pidió explícitamente Archivo Narrow Bold con el pixelado tMSC nivel 2 (celda 6 a 1080 de ancho, escalones visibles en curvas y diagonales, solo en el titular). El lockup y el texto chico se quedan limpios y nítidos.
- Cualquier lectura que convierta esto en un template “Y2K / brutalist poster” genérico.
- Inventar palabras, labels en mayúsculas con cuadradito naranja, íconos de más, estrellas, stickers, fotos, 3D, sombras, brillos, degradés.
- Usar el ácido `#E4FC24` como fondo (es de otras tools tMSC, no de este KV).
- Los colores muestreados son evidencia de *este* PNG (tiene grano y deriva de generación). La paleta de trabajo de la tool son los tokens oficiales, más el amarillo muestreado `#F6E95B`. Se puede ofrecer un preset “match KV” con los hex muestreado, pero el default son los tokens.

## 2. Sistema escrito del KV

`../flora-system-prompt.md` y `../flora-prompt-vertical-now-dominant.md`. Salieron del trabajo con Flora (nodos de texto + imagen). Ya no se usan para generar: se usan como lista de reglas del sistema.

### Tomar

Las reglas de superficie, bloques, acento, lockup, lógica de composición, “qué varía / qué no cambia” y el anti-slop. La variación vertical (9:16, “Now” dominante, “Motion,” más chico arriba, grilla más densa, asterisco cruzando un borde de bloque, lockup abajo a la izquierda sobre un bloque) es un buen layout de partida para el preset 9:16.

### Ignorar

Pedidos a un modelo de imagen (“describe before you generate”, anti-slop de lettering inventado, etc.). El prompt vertical en un momento pedía slab serif y “three lines” para dos palabras: eso ya se corrigió a Archivo Narrow pixelado. No reintroducir stencil ni serif.

## 3. Pixelado tMSC nivel 2

Hay dos implementaciones hermanas, la misma idea:

- `creative-practice/tools-diarias/shared/base.js` — `pixelate()`, `pixelText()`, `hybridText()`. Nivel 2 = `TOKENS.pixelCell = 6`. Comentario en el README de shared: “celda 6 para titulares bold; el texto pequeño nunca se pixela”. `pixelText` dibuja el glifo en un canvas, muestre el centro de cada celda, y pinta un cuadrado (`cell` o `cell-1` si `gap`).
- `post-studio/templates/key-visuals/bitmap.js` — `KVBitmap.render({cell, bleed, slope, intercept, ...})`: dibuja a resolución 1/cell, umbral duro (default 110), upscale nearest-neighbour, bleed gaussiano opcional. Es el efecto de kv-03 / kv-09. El render batch de Python (`post-studio/render_px.py`) documenta la misma cadena.

### Tomar

El algoritmo de `pixelText` / `KVBitmap` (raster → umbral por celda → nearest). Celda nominal 6 a 1080 de ancho, escalada con el ancho del formato: `cell = max(2, round(6 * width / 1080))`. Solo el titular (layers `headline`). Lockup y texto de apoyo, limpios. Diales de `cellAt1080` y de gap. Preview y export usan la misma función.

### Ignorar

`hybridText` (borde pixelado + counters vectoriales): es de otra exploración (Figma Q3). Acá el titular se pixela entero, counters incluidos, para que se lea como bitmap de celdas. No uses bleed gaussiano en el default del nivel 2 que Esteban describió (“crisp hard edges, no blur and no anti-aliasing”); el bleed de `bitmap.js` puede quedar como idea posterior en `ideas.md`.

## 4. Builder de Esteban (convenciones de tool)

`creative-practice/builder/`: `00-INTRO-PROMPT.md`, `ENV-INTERFACE.md`, `DIALKIT-NOTES.md`, `PLAN.md`. Hex como norte: rigor, sobriedad, sensación de herramienta. DialKit 2 para diales. Un solo `render()` para preview y export. Presets = JSON versionado. Mediabunny para MP4, nunca GIF. Archivo Narrow. Nunca `#0000FF` ni `#3D3DEB`.

### Tomar

El contrato de entorno (aunque esta tool puede vivir sola al principio y enchufarse después), DialKit inline, params en un ref mutable, export determinista, atajos, UI de herramienta y no de dashboard. El proceso de paradas de Szymon, igual que en el builder.

### Ignorar

La paleta de 2 tintas del builder (esta campaña tiene un set cerrado más amplio: amarillo, rosa, lila, verde, marrón, tinta, blanco del lockup). Los 19 entornos. Cualquier cosa de spray / Motion Instrument / Edad de la Ciudad.

## 5. Szymon, proceso de 6 pasos

`/workspace/refs/szymon-aecyy-tools-ia.md`. “Antes hacía los visuales; ahora construyo el sistema que los hace.”

### Tomar

Los seis pasos, tal cual están aplicados en este paquete. La tool es la pieza.

### Ignorar

El look 3D / path tracer / materiales cromados.

## Qué tienen en común

Un sistema con reglas duras (paleta, tipo, grilla) que produce muchas piezas. La tipografía se construye, no se “filtra”. El diseñador edita el sistema, no pide otra imagen.

## La idea a tomar

Un Figma chico, solo para este KV: las piezas del sistema son capas editables, la grilla manda, el titular se escribe de verdad en Archivo Narrow y se pixela en vivo, y un cambio de formato relayoutéa la composición. Las variaciones de copy (“Survey open”, “23 questions”, fechas) se hacen acá, no en un modelo de imagen.
