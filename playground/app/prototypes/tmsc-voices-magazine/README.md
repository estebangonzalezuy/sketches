# tMSC Voices — revista 3D

Un zine 3D con las últimas cuatro entrevistas de the Motion Social Club. Se hojea con un page-curl de papel y graba un MP4 de la secuencia demo.

## Cómo correr

Desde `playground/`:

```bash
npm install
```

```bash
npm run dev
```

Abrí http://localhost:3000/prototypes/tmsc-voices-magazine

- Arrastrá la página derecha hacia la izquierda para avanzar y la izquierda hacia la derecha para volver.
- Un click voltea la página.
- ← → voltean, Home vuelve a la tapa con un flip-through y End va a la contratapa.
- Al pasar el mouse cerca del canto se levanta la esquina.

## Cómo armar cada feature

El panel de controles está a la derecha en desktop. En el teléfono se abre con el botón de abajo a la derecha. Para cada invitade:

- **Image:** cualquiera de las imágenes de su post, en el orden en que aparecen. La portada está marcada. Con **None** la página queda solo tipográfica.
- **Frame:** para los GIFs, uno de 6 cuadros tomados a lo largo de la animación. Las imágenes fijas tienen un solo cuadro.

Además, **Image: Fit / Fill** muestra la imagen entera o recortada al alto de la caja, e **Image size %** (30–100) la achica hacia la esquina inferior izquierda; el crédito la sigue. Aplica a los cuatro spreads. Las elecciones se guardan en el browser. **Reset** vuelve a las portadas y **Randomize** arma una combinación al azar. El export usa siempre lo que esté elegido en ese momento.

## Colores de cada página

Cada spread tiene **left page** y **right page** para el color de fondo de cada página. La tapa y la contratapa tienen **Cover color** y **Back cover color**. El texto pasa solo a negro o blanco según el fondo. Mientras una página conserve su color original, mantiene la tinta del diseño (por ejemplo, el verde de Doug sobre blanco).

## Páginas Q&A (editoriales)

Con **Q&A pages** activado, cada entrevista suma un segundo spread con la conversación en columnas, como una revista impresa. Las preguntas de Esteban van en negrita y las respuestas del invitade debajo, verbatim de los posts publicados.

- **Q&A columns:** 1 (texto corrido), 2 o 3 columnas.
- **Q&A text:** tamaño Small, Medium o Large.
- **Q&A image 1 / 2** (por invitade): cualquier imagen de su post, o None. La 1 va arriba en la página derecha y la 2 abajo en la izquierda.
- **Q&A image size %:** el tamaño de esas imágenes.
- **Q&A page color:** el color de esas páginas. El texto se ajusta a negro o blanco solo.

El texto entra hasta donde haya lugar y nunca corta una frase a la mitad. Si queda espacio, cierra con "Read the full conversation at themotionsocialclub.substack.com". Con Q&A pages apagado, la revista vuelve a tener 5 hojas.

## Tiempos, easing y línea de tiempo

En el panel están los valores generales:

- **Turn duration:** cuánto dura cada giro de página.
- **Turn easing:** la curva del giro. Opciones: Hand (el default), Ease in-out, Ease out, Ease in, Snappy, Soft y Linear, todas como cubic-bézier.
- **Hold on spreads / Hold on Q&A:** cuánto se queda en cada spread.
- **Flip-through gap / sheet:** el ritmo de la cascada final.

Estos valores rigen tanto los clicks y las flechas en vivo como el Record.

El botón **Timeline** abre la secuencia del Record como una línea de tiempo:

- **Play** la reproduce en la escena tal cual va a exportarse. La regla de arriba sirve para scrub.
- Los bloques están a escala. Cada giro muestra su curva de easing.
- Arrastrá el borde derecho de un bloque para alargarlo o acortarlo. Con un click lo seleccionás y podés escribir la duración exacta y elegir el easing de ese giro. **Use default** quita la edición de ese bloque y **Reset edits** las quita todas.
- Los bloques editados aparecen resaltados y las ediciones se guardan en el browser.
- Tocar la revista, una flecha o Record sale del preview y deja la revista en el spread que se estaba viendo.

## Texturas

**Page texture** y **Background texture** eligen el papel de las páginas y del fondo por separado, cada uno con su intensidad (0–200 %). Opciones:

- Newsprint
- Recycled (más fibras)
- Laid (líneas de papel verjurado)
- Linen (tejido)
- Riso grain
- Smooth (sin textura)
- Uploaded

Para probar una textura propia: **Upload → Paper texture…**. La imagen se repite como mosaico y se normaliza para que agregue textura sin teñir. Queda guardada en el browser.

## Papel en 3D

Además de la textura impresa, el papel tiene su tratamiento como material:

- **Paper finish:** Matte (sin brillo, el default), Uncoated, Satin o Gloss. Cuanto más satinado, más reflejos de la luz sobre el papel y la tinta.
- **Paper relief:** usa la textura de la página como relieve real. La fibra, el grano o el tejido se iluminan y hacen sombra, sobre todo mientras la hoja gira. Con Smooth no hay relieve.
- **Paper weight:** Light, Regular o Heavy. El papel liviano se curva más al girar; el pesado queda más rígido y el taco se ve más grueso.
- **Paper waviness:** cuánto se ondula la hoja en reposo, como papel que no queda del todo plano.

## Fondo

- **Background:** el color del fondo detrás de la revista. Por defecto #EAEAEA.
- **Grid:** la grilla fina con crop marks. Viene apagada.

## Tapa

En el panel, **Cover** elige el estilo:

- **Type:** blanco con tipo negro. Es el default.
- **Full image:** la imagen a sangre, con el tipo encima.
- **Image on color:** la imagen dentro de un fondo del color que elijas en **Cover color** (que también colorea la tapa Type).

**Cover image** elige de dónde sale la imagen: la que subiste o la imagen elegida para alguno de los cuatro spreads. **Cover image size %** (30–100) achica la imagen dentro de su espacio en Image on color. **Cover type** pone el tipo en negro o en blanco, según el fondo.

Para subir una imagen, usá **Upload → Cover image…** en la fila de abajo. La imagen se achica a 1600 px como máximo y queda guardada en este browser; no se sube a ningún lado. Al subirla, la tapa pasa a usarla.

La contratapa es blanca con tipo negro y la URL `themotionsocialclub.substack.com`.

## Cómo exportar el MP4

1. Elegí el formato en el panel (**Export**): **1:1** (1080×1080) o **4:5** (1080×1350).
2. Tocá **Record**. La pieza recorre todos los spreads en orden y vuelve a la tapa en cascada: unos 18 s sin páginas Q&A y unos 29 s con ellas, a 60 fps cuadro por cuadro, con las mismas luces y texturas que el modo interactivo, sin cursor ni UI.
3. Al terminar baja `tmsc-voices-1080x1080.mp4` (o `…1080x1350.mp4`). Es H.264, nunca GIF. Mientras graba, el botón muestra el % y sirve para cancelar.

La secuencia es determinista: el mismo export da los mismos cuadros. El fondo sigue el tema del playground (claro o oscuro), así que grabá con el tema que quieras en el post.

Para sacar stills exactos de cualquier momento de la secuencia, abrí la página con `?debug=1` y en la consola corré `window.__tmsc.frame(t, 1080, 1080)`. Devuelve un PNG en data URL.

## Límites

- **Hace falta WebCodecs** (Chrome, Edge o Safari 17+). Si el browser no tiene encoder H.264, el export cae a VP9 dentro de MP4.
- **El export no es en tiempo real.** En una laptop tarda unos segundos; en una máquina sin GPU (un CI headless, por ejemplo) puede tardar minutos.
- **Mobile** usa el mismo curl con un encuadre más cerrado y texturas más chicas. No implementé el plegado distinto para mobile que describe Ksenia.
- **Imágenes.** Están todas las de los cuatro posts, bajadas de los originales; solo quedaron afuera los separadores de sección. Los GIFs van como stills (6 cuadros a elegir), no animados. Las capturas del post de Justin (el sitio de FrameRate y "Vimeo’s old days") tienen tipo chico que no se lee en la página.
- **Video de referencia.** El mp4 de la ref no estaba en el entorno. La ref se leyó del contact sheet.
- **Imagen subida.** Vive en el storage de este browser. En otro browser o dispositivo hay que volver a subirla.
- **Sin sonido de papel**, ni deep link al spread por URL (ver `ideas.md`).
