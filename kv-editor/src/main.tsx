import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dev-only hook for headless comparisons against the master (scripts in the scratchpad).
if (import.meta.env.DEV) {
  Promise.all([import('./presets'), import('./render/render'), import('./fonts')]).then(([presets, r, fonts]) => {
    (window as unknown as Record<string, unknown>).__kv = { presets, render: r.render, fonts };
  });
}
