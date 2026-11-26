# Ideas — tMSC Voices, revista 3D

Formato: idea, tamaño (S/M/L), estado. Estados: pendiente, en curso, hecha, descartada, después.

## Must (v1)

- **Page curl creíble, un sheet a la vez** — L — hecha. Vertex shader analítico (opción A): el canto lleva, la zona del lomo se atrasa, el resto se enrolla en un cilindro con un pliegue inclinado hacia la esquina que agarrás, y la hoja rota en el lomo. Normales por diferencias finitas y la misma deformación en el depth material, así que la sombra sigue la hoja.
- **4 spreads de entrevista + tapa + contratapa** — M — hecha. 5 hojas: spread k = dorso de la hoja k−1 + frente de la hoja k. Páginas bakeadas en canvas 2D a 1440×2000 (1008×1400 en el teléfono), con mipmaps y anisotropía.
- **Drag / click / hover lift / teclas** — M — hecha. Umbral de commit a mitad de giro o con un swipe rápido. Home hace un flip-through en cascada.
- **Cámara fija, luz simple, sombra de contacto** — S — hecha. Hemisphere + una directional con sombra. Papel Lambert, sin especular ("no tan glossy"). Sombra de contacto suave bajo cada pila.
- **Modo Record, path determinista, export MP4** — M — hecha. 18 s, 60 fps, 1:1 y 4:5, H.264 vía WebCodecs + mp4-muxer. Nunca GIF.
- **Design system tMSC** — S — hecha. Archivo Narrow, 2–3 tintas por spread, sin 2026, sin eyebrows, filetes ni marcos.

## Nice

- **Elegir los media de cada feature** — M — hecha. Todas las imágenes de los posts, con imagen + cuadro por invitade, Fit / Fill, persistido en el panel. El crédito "Work by …" quemado en los GIFs se recortó; la página imprime el crédito del post.
- **Tapa y contratapa blancas con tipo negro** — S — hecha.
- **Textura tipo papel de diario (leve)** — S — hecha. Pulpa, grano, fibras cortas y un tono apenas cálido, bakeados en la textura. La primera versión quedó demasiado fuerte y se bajó.
- **Tapa con imagen** — M — hecha. Subida propia (guardada en el browser) o la imagen de un spread, a sangre o sobre un color a elegir, con tipo negro o blanco.
- **Tamaño de imagen** — S — hecha. Un slider para la imagen de los spreads (global) y otro para la tapa en Image on color.
- **Color de cada página** — S — hecha. Fondo por página (8 páginas de entrevista, tapa y contratapa); el tipo cambia a negro o blanco según el fondo.
- **Tamaño por spread** — S — después, si hace falta ajustar cada uno por separado.
- **Spreads editoriales (Q&A)** — L — hecha. Un spread por entrevista con la conversación verbatim en 1 a 3 columnas, tamaño de texto, dos imágenes del post con tamaño ajustable y color de página. Corta solo en fin de oración.
- **Fondo del canvas** — S — hecha. Color a elegir, textura de papel y grilla opcional (apagada por defecto).
- **Línea de tiempo con easing y duraciones** — L — hecha. Valores generales en el panel; en la línea de tiempo, preview, scrub, bloques a escala con su curva, estirar arrastrando, duración y easing por giro, persistido.
- **Texturas intercambiables** — M — hecha. Siete papeles (incluida una textura subida) para páginas y fondo por separado, con intensidad.
- **Papel como material 3D** — M — hecha. Acabado (mate a brillante), relieve con bump desde la textura, peso (curvatura y grosor) y ondulación.
- **Curva bézier editable a mano** (arrastrar los handles) — M — después. Hoy son presets.
- **Record más corto con Q&A** (por ejemplo, saltear los spreads Q&A en el video) — S — después. Hoy el video con Q&A dura unos 29 s.
- **GIFs animados en la página** — L — después. Haría falta una textura de video por página y hacer seek por cuadro en el Record para que siga siendo determinista.
- **Elegir la cita hero** (entre las tres de `content.json`) — S — después.

- **Flip-through en cascada** — M — hecha. Con Home en vivo, y al final del Record.
- **Grano de papel** — S — hecha. Bakeado en la textura (multiply muy suave), así entra en los mipmaps y no titila al moverse.
- **Micro-movimiento en reposo** — S — hecha. El canto exterior respira un milímetro. Se apaga con reduced motion.
- **Centrar la revista cerrada** — S — hecha. Con la tapa sola o la contratapa sola, la revista se desliza para quedar centrada.
- **Sonido de hoja**, opt-in — S — después.
- **Fold distinto para mobile** (como el de Ksenia) — M — después. En v1, el mismo curl con un encuadre más cerrado.
- **URL share con el spread en el hash** — S — después.
- **Inside front tipográfico** — S — descartada. Con el mapeo de 5 hojas, el dorso de la tapa es la página izquierda de Victor, y el índice vive en la tapa (los 4 nombres con fecha).
- **Canto visible del taco** (geometría de espesor) — S — después. Hoy se lee por el escalonado de 3 mm entre hojas y la sombra.

## Escenario

Variante A (campo + grilla fina + crop marks), atada al tema del playground: claro en light, `--background` oscuro en dark. La grilla y las marcas leen los tokens.

## Decisiones del paso 3 (curl)

| | Calidad | Control | Trabajo | Riesgo | Costo de cambiar |
| --- | --- | --- | --- | --- | --- |
| A. Shader analítico | Alta, papel continuo | Total (uniforms) | M | Sombras: resuelto con depth material propio | Bajo |
| B. Huesos / skinned | Media, facetas | Medio | M–L | Normales y sombras | Alto |
| C. Rígido + bend mínimo | Tarjeta | Bajo | S | No cumple la ref | — |

Elegida: **A**.

## Bugs y cómo se resolvieron

- **Páginas izquierdas grises.** El `normalBias` de la sombra empujaba la superficie de las hojas volteadas dentro de su propia sombra, porque la normal del vértice apunta hacia abajo. Se resolvió sacando el normalBias y dejando solo `bias`. Primer intento, resuelto.
- **Grilla blanca en dark.** El token `--border` tiene alfa. Se resolvió componiéndolo sobre el color de fondo antes de pasarlo a three.js.

## Descartadas de entrada

- El zine de café, ilustraciones de Georgi, arte de Agu / Paper Mono, Paper Mono como tipo.
- El año 2026 en tapa, folios o UI.
- Capturas de Substack como página. Las previews sociales a full bleed.
- Orbit / pan de cámara como interacción. Física de tela.
- GIF, watermark, stickers, labels naranja.
- La frase del "90 %" que Victor relata de un amigo como cita de él.

## Riesgos que siguen abiertos

- **Cascada muy rápida.** Con un stagger más corto que el actual, dos hojas en vuelo podrían cruzarse. El Record usa 0,38 s de stagger y en vivo 0,12 s con menos bend. Si se ve un cruce, subir el stagger.
- **Memoria.** 10 texturas de 1440×2000 con mipmaps son unos 150 MB de GPU en desktop. En el teléfono se bakea más chico.
