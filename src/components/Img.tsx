import { ImgHTMLAttributes, useEffect, useMemo, useState } from 'react';
import type { Photo } from '../lib/drive';

type Props = { photo: Photo; size: number } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

/** Ảnh có cơ chế dự phòng (URL lỗi → thử URL kế tiếp) và class `is-loaded` khi tải xong. */
export function Img({ photo, size, alt, className, onError, onLoad, ...rest }: Props) {
  const srcs = useMemo(() => photo.sources(size), [photo, size]);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setI(0);
    setLoaded(false);
  }, [srcs]);
  return (
    <img
      {...rest}
      className={[className, loaded ? 'is-loaded' : ''].filter(Boolean).join(' ') || undefined}
      src={srcs[Math.min(i, srcs.length - 1)]}
      alt={alt ?? photo.name}
      referrerPolicy="no-referrer"
      draggable={false}
      decoding="async"
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        if (i + 1 < srcs.length) setI(i + 1);
        else onError?.(e);
      }}
    />
  );
}

/** Tải trước một ảnh, trả về khi ảnh sẵn sàng (hoặc hết thời gian chờ). */
export function preload(photo: Photo, size: number, timeout = 2500): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const done = () => resolve();
    const t = setTimeout(done, timeout);
    img.onload = img.onerror = () => {
      clearTimeout(t);
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(done);
    };
    img.src = photo.sources(size)[0];
  });
}
