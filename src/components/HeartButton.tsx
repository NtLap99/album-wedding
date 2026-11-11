import { useEffect, useState } from 'react';
import { isCover, onToast, toggleCover, useCovers } from '../lib/covers';
import type { Photo } from '../lib/drive';

/** Nút ♥: đặt / bỏ ảnh này làm ảnh bìa của album chứa nó. */
export function HeartButton({ photo, className = '' }: { photo: Photo; className?: string }) {
  const covers = useCovers();
  const on = isCover(covers, photo);
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      className={`heart-btn ${on ? 'on' : ''} ${className}`}
      title={on ? 'Bỏ ảnh bìa album' : 'Đặt làm ảnh bìa album'}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        if (toggleCover(photo)) setPop((x) => x + 1);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" key={pop} className={pop ? 'pop' : ''}>
        <path
          d="M12 21s-8.5-5.2-8.5-11.7C3.5 6.2 5.8 4 8.6 4c1.5 0 2.7.7 3.4 1.8C12.7 4.7 13.9 4 15.4 4c2.8 0 5.1 2.2 5.1 5.3C20.5 15.8 12 21 12 21z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function Toast() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  useEffect(
    () =>
      onToast((text) => {
        const id = Date.now();
        setMsg({ text, id });
        setTimeout(() => setMsg((m) => (m?.id === id ? null : m)), 2200);
      }),
    [],
  );
  if (!msg) return null;
  return (
    <div className="toast" key={msg.id} role="status">
      {msg.text}
    </div>
  );
}
