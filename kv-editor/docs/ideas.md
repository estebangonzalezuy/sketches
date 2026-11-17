# ideas.md — KV editor, Motion, Now

Paso 4 de Szymon. Tamaño: S (≤½ día), M (1–2 días), L (3+). Estado: hecha / descartada / después.

Lo que está en el alcance v1 no se lista como “después” salvo que quede explícitamente fuera. El boceto `sketch/` no cuenta como “hecha” la app.

| Idea | Nota | Tamaño | Estado |
|---|---|---|---|
| Paquete de prompts + spec + boceto | Este directorio | M | hecha (17/11/2026) |
| App React: render, capas, snap, texto inline, formatos, JSON, PNG | El trabajo de Claude Code, fases 2–5 del PLAN | L | después |
| Preset “match KV” con hex muestreados del PNG | Además de los tokens oficiales; ver refs.md | S | después |
| Acción “caber al ancho del bloque” para un headline | El `fit` de KVBitmap, disparado a mano | S | después |
| Bleed gaussiano opcional del bitmap (slope/intercept de bitmap.js) | No es el default del nivel 2 que pidió Esteban | S | después |
| Tracks explícitos de grilla (tipo CSS grid), editables | Alternativa B del PLAN; v1 usa unidad regular + pinta irregular | M | después |
| Deshacer / rehacer (historial de composiciones) | Conveniente apenas haya edición real | S | después |
| Export PNG @2x / @3x | Mismo render a canvas más grande; cell escalado | S | después |
| Export MP4 (Mediabunny + WebCodecs, fallback headless) | Animar bloques, titular, asterisco; loops mostrables. Nunca GIF | M | después |
| DialTimeline para automatizar posiciones / tamaños | Cuando exista MP4 | M | después |
| Enchufar la tool como entorno del builder | Envolver `render` en el contrato Env | M | después |
| Varios documentos / páginas en un archivo | Tipo “artboards” de la campaña | M | después |
| Biblioteca de lockups y de asteriscos a varios tamaños | El lockup no se redibuja; sí se instancia | S | después |
| Guías manuales extra, al estilo Figma | Solo si la unidad no alcanza | S | después |
| Texto curvo, booleanas, sombras, foto de fondo, 3D | Rompe el sistema | — | descartada |
| Generar variaciones con Flora / fal / Nano Banana adentro de la tool | Esteban pidió la tool *sin* fal, con texto verdadero | — | descartada |
| Tipografía stencil del PNG como opción | Esteban la reemplazó por Archivo Narrow + pixel nivel 2 | — | descartada |
| Auto-layout mágico al cambiar formato, sin presets | Alto riesgo, bajo control | L | descartada por ahora |
