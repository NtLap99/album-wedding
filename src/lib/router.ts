import { useEffect, useState } from 'react';

/** URL dạng #/idNhom/idAlbum — giữ cả đường dẫn để hiển thị breadcrumb và chia sẻ link. */
function parse(): string[] {
  const h = location.hash.replace(/^#\/?/, '');
  return h ? h.split('/').filter(Boolean).map(decodeURIComponent) : [];
}

export function useTrail() {
  const [trail, setTrail] = useState(parse);
  useEffect(() => {
    const on = () => {
      setTrail(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return trail;
}

export function navigate(ids: string[]) {
  location.hash = '/' + ids.map(encodeURIComponent).join('/');
}
