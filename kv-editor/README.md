# KV Editor — Motion, Now

Editor dedicado al key visual de **Motion, Now** (tMSC). Arranca del KV master reconstruido como capas editables y desde ahí se reescribe el copy, se agregan elementos y se adapta a otros formatos. Sin modelos de imagen: todo se dibuja con un solo `render(ctx, composition)` (preview = PNG).

```bash
npm install
npm run dev      # http://localhost:5195
npm run build
```

## Qué hay

- **16:9 = el KV master**, medido sobre `refs/kv-main.png`: bloques, escuadra, grilla (segmentos medidos), cruces, asterisco, lockup y los dos titulares calzados a la caja de tinta del original. En el panel de Composición → Vista, “Ver KV original” superpone el master (con modo diferencia) para comparar.
- **Tratamiento tipográfico KV** (`src/render/type.ts`): contornos reales de la fuente (opentype.js) → las curvas se rehacen con aristas a 0/45/90° (los bowls octogonales del KV), las rectas quedan exactas (N, w) → muescas tipo cerradura en los counters altos → puntos redondos → pasada de tinta (esquinas suaves + borde irregular con ruido con semilla). Diales: facetas, muescas, tinta, esquinas. Base: Barlow Condensed Bold (la más cercana en proporción y peso; el stencil original no es una fuente disponible). También: **Pixel** (tMSC nivel 2, celda @1080) y **Limpio**.
- **Capas**: titular, texto, bloque, escuadra, grilla (regenerable), formas (asterisco, círculo, semicírculo, flecha, cruz, fantasma, marca M), caracteres sueltos (&, ?, 23…) con el tratamiento KV, lockup (wordmark editable) e imagen/personaje (con silueta a un color de la paleta y pixelado opcional).
- **Video y GIF**: “+ Agregar → Video / GIF…” o arrastrar archivos al lienzo (mp4, mov, webm, gif). Se ubican debajo del tipo, asterisco y lockup; encaje llenar/entero con foco, pixelado tMSC y desfase. Se reproducen en vivo (Espacio pausa). **MP4**: H.264, sale del mismo `render()` cuadro a cuadro (los videos se buscan al tiempo exacto, los GIF se decodifican con ImageDecoder), duración y fps en Composición → Video; sin audio. Los archivos quedan en IndexedDB del navegador y el JSON guardado los lleva embebidos.
- **Formatos**: 16:9, 4:5, 9:16, 1:1, banner. Al cambiar: *Adaptar* (layout del formato + tu copy, colores y tratamiento; lo extra se escala sin deformar), *Layout de partida* o *Escalar lo actual*.
- **Edición**: arrastrar, handles (proporcionales en tipo, formas y lockup), guías inteligentes, snap a unidad, doble click / Enter para editar texto in situ, flechas, `[` `]` orden, ⌘D, ⌘Z/⇧⌘Z, ⌘S JSON, ⌘E PNG (⇧ = @2x), 1–5 formatos.
- **Paleta** por composición (tokens): KV muestreado por defecto, tokens oficiales y variantes; editable.
- Autosave local; JSON versionado (`version: 1`) para guardar/abrir.

`docs/` tiene el paquete original (SPEC, PLAN, refs, ideas y recortes). Diferencias con esa spec: el titular usa el tratamiento KV (pedido explícito: partir *exactamente* del KV) y el pixelado queda como opción; la grilla es una capa con segmentos explícitos para poder reproducir la del master.

Fuentes: Barlow Condensed, Saira Extra Condensed, Sofia Sans Extra Condensed, Big Shoulders, Archivo, Archivo Narrow, Inter — todas OFL (vía @fontsource y el paquete).
