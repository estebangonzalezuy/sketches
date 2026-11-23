/**
 * The playhead. Lives outside React: the stage redraws from it on every tick and only the
 * transport and the key lanes subscribe to it, so playing never re-renders the panels.
 */
export type Clock = ReturnType<typeof createClock>;

export function createClock() {
  let t = 0;
  let playing = false;
  let duration = 6;
  let loop = true;
  let raf = 0;
  let last = 0;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    if (t >= duration) {
      if (loop) t %= duration;
      else {
        t = duration;
        playing = false;
      }
    }
    emit();
    if (playing) raf = requestAnimationFrame(tick);
  };

  return {
    get t() {
      return t;
    },
    get playing() {
      return playing;
    },
    get duration() {
      return duration;
    },
    configure(d: number, l: boolean) {
      duration = d;
      loop = l;
      if (t > d) t = d;
      emit();
    },
    seek(next: number) {
      t = Math.max(0, Math.min(duration, next));
      emit();
    },
    play() {
      if (playing) return;
      if (t >= duration) t = 0;
      playing = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
      emit();
    },
    pause() {
      playing = false;
      cancelAnimationFrame(raf);
      emit();
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
