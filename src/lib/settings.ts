import { useEffect, useState } from 'react';

export type Layout = 'justified' | 'magazine' | 'masonry' | 'hanging' | 'film' | 'grid' | 'polaroid';
export type Effect =
  | 'kenburns'
  | 'fade'
  | 'heart'
  | 'circle'
  | 'curtain'
  | 'drop'
  | 'slide'
  | 'zoom'
  | 'dream'
  | 'page'
  | 'random';
export type Falling = 'hearts' | 'petals' | 'leaves' | 'sparkles' | 'none';

export interface Settings {
  layout: Layout;
  effect: Effect;
  interval: number;
  falling: Falling;
  trail: boolean;
}

export const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 'justified', label: 'Hàng đều' },
  { value: 'magazine', label: 'Tạp chí' },
  { value: 'masonry', label: 'So le' },
  { value: 'hanging', label: 'Dây treo ảnh' },
  { value: 'film', label: 'Băng phim' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'grid', label: 'Lưới vuông' },
];

export const EFFECTS: { value: Effect; label: string }[] = [
  { value: 'kenburns', label: 'Ken Burns' },
  { value: 'fade', label: 'Hoà tan' },
  { value: 'heart', label: 'Mở hình trái tim' },
  { value: 'circle', label: 'Vòng tròn lan' },
  { value: 'curtain', label: 'Rèm cửa' },
  { value: 'drop', label: 'Thả rơi' },
  { value: 'slide', label: 'Trượt ngang' },
  { value: 'zoom', label: 'Phóng nhẹ' },
  { value: 'dream', label: 'Mơ màng' },
  { value: 'page', label: 'Lật trang sách' },
  { value: 'random', label: 'Ngẫu nhiên' },
];

export const FALLINGS: { value: Falling; label: string }[] = [
  { value: 'hearts', label: '♥ Trái tim' },
  { value: 'petals', label: '🌸 Cánh hoa' },
  { value: 'leaves', label: '🍃 Lá mint' },
  { value: 'sparkles', label: '✦ Lấp lánh' },
  { value: 'none', label: 'Tắt' },
];

export const INTERVALS = [3, 5, 8, 12];

const DEFAULTS: Settings = { layout: 'justified', effect: 'kenburns', interval: 5, falling: 'hearts', trail: true };
const KEY = 'album-settings-v4';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

export function useSettings() {
  const [s, setS] = useState<Settings>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);
  const update = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }));
  return [s, update] as const;
}
