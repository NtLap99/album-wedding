import { CSSProperties, useEffect, useRef } from 'react';
import type { Photo } from '../lib/drive';
import type { Layout } from '../lib/settings';
import { HeartButton } from './HeartButton';
import { Img } from './Img';

export function Gallery({ photos, layout, onOpen }: { photos: Photo[]; layout: Layout; onOpen: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Hiệu ứng ảnh hiện dần khi cuộn tới
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('.g-item');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        let k = 0;
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.setProperty('--delay', `${(k++ % 8) * 60}ms`);
            el.classList.add('in');
            io.unobserve(el);
          }
        }
      },
      { rootMargin: '0px 0px -30px 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [photos, layout]);

  // Băng phim: lăn chuột dọc để cuộn ngang
  useEffect(() => {
    const el = ref.current;
    if (!el || layout !== 'film') return;
    const on = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY > 0 && el.scrollLeft >= max - 1) || (e.deltaY < 0 && el.scrollLeft <= 0)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', on, { passive: false });
    return () => el.removeEventListener('wheel', on);
  }, [layout]);

  return (
    <div ref={ref} className={`gallery layout-${layout}`}>
      {photos.map((p, i) => {
        const r = p.width / p.height;
        const style = {
          '--ar': `${p.width} / ${p.height}`,
          '--r': r,
          '--rot': `${((i * 37) % 7) - 3}deg`,
          ...(layout === 'justified' ? { flexGrow: r } : {}),
        } as CSSProperties;
        // Bố cục tạp chí: ảnh nổi bật to gấp đôi, ảnh dọc cao gấp đôi, ảnh ngang rộng gấp đôi
        const shape =
          layout === 'magazine'
            ? i % 7 === 0
              ? 'big'
              : r < 0.85
                ? 'tall'
                : r > 1.3
                  ? 'wide'
                  : ''
            : '';
        // Chỉ hiện tên file nếu là tên có nghĩa (vd "Cô dâu tung hoa.jpg"), bỏ qua mã máy ảnh như "MSO00014"
        const base = p.name.replace(/\.[^.]+$/, '');
        const caption = /\s|[^\x00-\x7F]/.test(base) ? base : '♥';
        const frame = (
          <div className="g-frame">
            <Img photo={p} size={layout === 'grid' || layout === 'polaroid' || layout === 'hanging' ? 600 : 900} loading="lazy" />
            <HeartButton photo={p} className="g-heart" />
          </div>
        );
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            className={`g-item ${shape}`}
            style={style}
            onClick={() => onOpen(i)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(i))}
            aria-label={p.name}
          >
            {layout === 'hanging' ? (
              <div className="g-card">
                {frame}
                <span className="g-cap">{caption}</span>
              </div>
            ) : (
              <>
                {frame}
                {layout === 'polaroid' && <span className="g-cap">{caption}</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

