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

## Cómo exportar el MP4

1. Elegí el formato abajo: **1:1** (1080×1080) o **4:5** (1080×1350).
2. Tocá **Record**. La pieza recorre la secuencia del storyboard (18 s, 60 fps) cuadro por cuadro, con las mismas luces y texturas que el modo interactivo, sin cursor ni UI.
3. Al terminar baja `tmsc-voices-1080x1080.mp4` (o `…1080x1350.mp4`). Es H.264, nunca GIF. Mientras graba, el botón muestra el % y sirve para cancelar.

La secuencia es determinista: el mismo export da los mismos cuadros. El fondo sigue el tema del playground (claro o oscuro), así que grabá con el tema que quieras en el post.

Para sacar stills exactos de cualquier momento de la secuencia, abrí la página con `?debug=1` y en la consola corré `window.__tmsc.frame(t, 1080, 1080)`. Devuelve un PNG en data URL.

## Límites

- **Hace falta WebCodecs** (Chrome, Edge o Safari 17+). Si el browser no tiene encoder H.264, el export cae a VP9 dentro de MP4.
- **El export no es en tiempo real.** En una laptop tarda unos segundos; en una máquina sin GPU (un CI headless, por ejemplo) puede tardar minutos.
- **Mobile** usa el mismo curl con un encuadre más cerrado y texturas más chicas. No implementé el plegado distinto para mobile que describe Ksenia.
- **Imágenes.** Las stills salen de los recortes de las previews sociales (`covers/`), recortadas para sacar el ícono de Substack y el campo vacío de Thais y Doug. Son JPG chicos: se ven bien en la página, pero no aguantan un primer plano grande. Las originales en GIF están en substackcdn, que este entorno no pudo bajar.
- **Video de referencia.** El mp4 de la ref no estaba en el entorno. La ref se leyó del contact sheet.
- **Sin sonido de papel**, ni deep link al spread por URL (ver `ideas.md`).
