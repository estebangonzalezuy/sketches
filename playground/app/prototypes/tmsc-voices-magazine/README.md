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

## Fondo

- **Background:** el color del fondo detrás de la revista. Por defecto #EAEAEA.
- **Background paper:** la misma textura de papel que las páginas, sobre el fondo.
- **Grid:** la grilla fina con crop marks. Viene apagada.

## Tapa

En el panel, **Cover** elige el estilo:

- **Type:** blanco con tipo negro. Es el default.
- **Full image:** la imagen a sangre, con el tipo encima.
- **Image on color:** la imagen dentro de un fondo del color que elijas en **Cover color** (que también colorea la tapa Type).

**Cover image** elige de dónde sale la imagen: la que subiste o la imagen elegida para alguno de los cuatro spreads. **Cover image size %** (30–100) achica la imagen dentro de su espacio en Image on color. **Cover type** pone el tipo en negro o en blanco, según el fondo.

Para subir una imagen, tocá el botón **Cover** (el ícono de imagen) en la fila de abajo. La imagen se achica a 1600 px como máximo y queda guardada en este browser; no se sube a ningún lado. Al subirla, la tapa pasa a usarla.

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
