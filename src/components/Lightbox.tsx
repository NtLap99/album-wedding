import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { IS_DEMO, Photo } from '../lib/drive';
import { Effect, EFFECTS } from '../lib/settings';
import { HeartButton } from './HeartButton';
import { Img, preload } from './Img';
import {
  IconClose,
  IconDownload,
  IconExpand,
  IconExternal,
  IconGrid,
  IconLeft,
  IconPause,
  IconPlay,
  IconRight,
} from './Icons';

type RealEffect = Exclude<Effect, 'random'>;
const REAL_EFFECTS = EFFECTS.map((e) => e.value).filter((e): e is RealEffect => e !== 'random');

const pick = (e: Effect, prev?: RealEffect): RealEffect => {
  if (e !== 'random') return e;
  const pool = REAL_EFFECTS.filter((x) => x !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
};

const SIZE = typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 2400 : 1800;
/** Thời gian dài nhất của một hiệu ứng chuyển (ms) — sau đó ảnh cũ được gỡ bỏ. */
const TRANSITION_MS = 1500;

interface Props {
  photos: Photo[];
  startIndex: number;
  effect: Effect;
  interval: number;
  autoplay: boolean;
  title?: string;
  onClose: () => void;
}

export function Lightbox({ photos, startIndex, effect, interval, autoplay, title, onClose }: Props) {
  const len = photos.length;
  const [s, setS] = useState({ cur: startIndex, prev: -1, dir: 1, n: 0, eff: pick(effect) });
  const [playing, setPlaying] = useState(autoplay);
  const [thumbs, setThumbs] = useState(!autoplay);
  const [idle, setIdle] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Ảnh đích (có thể khác ảnh đang hiện khi ảnh mới còn đang tải)
  const target = useRef(startIndex);
  const token = useRef(0);
  const jump = useCallback(
    (to: number, dir?: number) => {
      const cur = ((to % len) + len) % len;
      if (cur === target.current) return;
      const d = dir ?? (cur > target.current ? 1 : -1);
      target.current = cur;
      const my = ++token.current;
      // Chỉ chạy hiệu ứng khi ảnh mới đã tải xong → chuyển cảnh mượt, không bị "giật"
      preload(photos[cur], SIZE, 1800).then(() => {
        if (my !== token.current) return;
        setS((p) => (cur === p.cur ? p : { cur, prev: p.cur, dir: d, n: p.n + 1, eff: pick(effect, p.eff) }));
      });
    },
    [len, effect, photos],
  );
  const next = useCallback(() => jump(target.current + 1, 1), [jump]);
  const prev = useCallback(() => jump(target.current - 1, -1), [jump]);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  // Tự động trình chiếu
  useEffect(() => {
    if (!playing || len < 2) return;
    const t = setTimeout(next, interval * 1000);
    return () => clearTimeout(t);
  }, [playing, s.n, interval, next, len]);

  // Gỡ ảnh cũ sau khi hiệu ứng kết thúc
  useEffect(() => {
    if (s.prev < 0) return;
    const n = s.n;
    const t = setTimeout(() => setS((p) => (p.n === n ? { ...p, prev: -1 } : p)), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [s.n, s.prev]);

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose();
      else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((x) => !x);
      } else if (e.key.toLowerCase() === 'f') toggleFs();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, toggleFs]);

  // Khoá cuộn trang nền
  useEffect(() => {
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = o;
      if (document.fullscreenElement) document.exitFullscreen?.();
    };
  }, []);

  // Ẩn thanh điều khiển khi không di chuột
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 2800);
    };
    wake();
    window.addEventListener('mousemove', wake);
    window.addEventListener('touchstart', wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('touchstart', wake);
    };
  }, []);

  // Tải trước ảnh kế bên
  useEffect(() => {
    for (const d of [1, -1, 2]) {
      const p = photos[(s.cur + d + len) % len];
      if (p) new Image().src = p.sources(SIZE)[0];
    }
  }, [s.cur, photos, len]);

  // Cuộn dải ảnh nhỏ tới ảnh hiện tại
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-i="${s.cur}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [s.cur, thumbs]);

  const photo = photos[s.cur];
  const stageStyle = { '--d': s.dir, '--kb': `${interval + 2}s` } as CSSProperties;

  return (
    <div ref={rootRef} className={`lb ${idle ? 'idle' : ''} ${thumbs ? 'with-thumbs' : ''}`} role="dialog" aria-modal>
      <div className="lb-backdrop" key={`bg${s.cur}`}>
        <Img photo={photo} size={400} alt="" />
      </div>

      <div
        className={`lb-stage fx-${s.eff}`}
        style={stageStyle}
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const t = touch.current;
          if (!t) return;
          const dx = e.changedTouches[0].clientX - t.x;
          const dy = e.changedTouches[0].clientY - t.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
          else if (dy > 90) onClose();
          touch.current = null;
        }}
      >
        {s.prev >= 0 && (
          <Img key={`i${s.prev}`} photo={photos[s.prev]} size={SIZE} className={`lb-img leave kbe${(s.n + 3) % 4}`} />
        )}
        <Img key={`i${s.cur}`} photo={photo} size={SIZE} className={`lb-img enter kb${s.n % 4}`} />
      </div>

      <div className="lb-top">
        <div className="lb-info">
          <span className="lb-count">
            {s.cur + 1} / {len}
          </span>
          {title && <span className="lb-title">{title}</span>}
        </div>
        <div className="lb-actions">
          <HeartButton photo={photo} className="lb-heart" />
          <button onClick={() => setPlaying((x) => !x)} title={playing ? 'Tạm dừng (Space)' : 'Trình chiếu (Space)'}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button onClick={() => setThumbs((x) => !x)} title="Dải ảnh nhỏ" className={thumbs ? 'on' : ''}>
            <IconGrid />
          </button>
          <button onClick={toggleFs} title="Toàn màn hình (F)">
            <IconExpand />
          </button>
          {!IS_DEMO && (
            <a href={photo.viewUrl} target="_blank" rel="noreferrer" title="Mở trên Google Drive">
              <IconExternal />
            </a>
          )}
          <a href={photo.downloadUrl} target="_blank" rel="noreferrer" title="Tải ảnh gốc">
            <IconDownload />
          </a>
          <button onClick={onClose} title="Đóng (Esc)">
            <IconClose />
          </button>
        </div>
      </div>

      {len > 1 && (
        <>
          <button className="lb-nav left" onClick={prev} aria-label="Ảnh trước">
            <IconLeft />
          </button>
          <button className="lb-nav right" onClick={next} aria-label="Ảnh sau">
            <IconRight />
          </button>
        </>
      )}

      {playing && len > 1 && (
        <div className="lb-progress" key={`pg${s.n}`} style={{ animationDuration: `${interval}s` }} />
      )}

      {thumbs && (
        <div className="lb-strip" ref={stripRef}>
          {photos.map((p, i) => (
            <button key={p.id} data-i={i} className={i === s.cur ? 'active' : ''} onClick={() => jump(i)}>
              <Img photo={p} size={200} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
