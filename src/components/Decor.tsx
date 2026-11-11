import { CSSProperties, useEffect, useMemo } from 'react';
import type { Falling } from '../lib/settings';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Vật trang trí rơi/bay nhẹ trên nền: tim, cánh hoa, lá, lấp lánh. */
export function FallingDecor({ kind }: { kind: Falling }) {
  const count = kind === 'sparkles' ? 22 : kind === 'leaves' ? 12 : 14;
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: rand(0, 100),
        top: rand(0, 100),
        size: kind === 'sparkles' ? rand(8, 16) : rand(9, 18),
        dur: kind === 'sparkles' ? rand(3, 6) : rand(14, 26),
        delay: -rand(0, 24),
        sway: rand(25, 80),
        hue: [350, 355, 0, 345, 10][Math.floor(rand(0, 5))],
        tint: Math.random() > 0.5,
      })),
    [count, kind],
  );
  if (kind === 'none') return null;
  return (
    <div className={`falling fall-${kind}`} aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: `${p.left}%`,
              ...(kind === 'sparkles' ? { top: `${p.top}%` } : {}),
              fontSize: p.size,
              width: p.size,
              height: kind === 'petals' ? p.size * 0.8 : p.size,
              animationDuration: kind === 'sparkles' ? `${p.dur}s` : `${p.dur}s, ${p.dur / 3}s`,
              animationDelay: kind === 'sparkles' ? `${p.delay / 4}s` : `${p.delay}s, ${p.delay}s`,
              '--sway': `${p.sway}px`,
              '--hue': p.hue,
            } as CSSProperties
          }
          className={p.tint ? 'tint' : ''}
        >
          {kind === 'hearts' ? '❤' : kind === 'sparkles' ? '✦' : ''}
        </span>
      ))}
    </div>
  );
}

/** Tim nhỏ bay theo con trỏ chuột, và một chùm tim bung ra khi bấm. */
export function HeartTrail() {
  useEffect(() => {
    const layer = document.createElement('div');
    layer.className = 'trail-layer';
    document.body.appendChild(layer);
    let last = 0;

    const spawn = (x: number, y: number, cls: string, style: Record<string, string>) => {
      const el = document.createElement('span');
      el.className = cls;
      el.textContent = '❤';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      for (const [k, v] of Object.entries(style)) el.style.setProperty(k, v);
      layer.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      spawn(e.clientX, e.clientY, 'trail-heart', {
        '--dx': `${rand(-14, 14)}px`,
        '--s': `${rand(0.6, 1)}`,
        '--h': `${[350, 0, 345][Math.floor(rand(0, 3))]}`,
      });
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.lb, button, a, .settings-panel')) return;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2);
        const r = rand(40, 80);
        spawn(e.clientX, e.clientY, 'burst-heart', {
          '--bx': `${Math.cos(a) * r}px`,
          '--by': `${Math.sin(a) * r}px`,
          '--s': `${rand(0.7, 1.3)}`,
          '--h': `${[350, 0, 345, 160][Math.floor(rand(0, 4))]}`,
        });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      layer.remove();
    };
  }, []);
  return null;
}
