import { useSyncExternalStore } from 'react';
import type { Photo } from './drive';

/**
 * Ảnh bìa album được chọn bằng nút ♥.
 * Lưu trong trình duyệt (localStorage): { [albumId]: photoId }.
 *
 * Để mọi người (khách xem trên máy khác) cũng thấy, đặt tên file trên Drive
 * bắt đầu bằng "cover" hoặc "bia" (vd "cover.jpg", "bia - co dau.jpg").
 */
type CoverMap = Record<string, string>;

const KEY = 'album-covers-v1';
const listeners = new Set<() => void>();

function read(): CoverMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

let state: CoverMap = read();

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function setCover(albumId: string, photoId: string | null) {
  const next = { ...state };
  if (photoId) next[albumId] = photoId;
  else delete next[albumId];
  state = next;
  emit();
}

export function toggleCover(photo: Photo): boolean {
  const on = state[photo.parent] !== photo.id;
  setCover(photo.parent, on ? photo.id : null);
  toast(on ? 'Đã đặt làm ảnh bìa album ♥' : 'Đã bỏ ảnh bìa');
  return on;
}

export function useCovers(): CoverMap {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const isCover = (covers: CoverMap, p: Photo) => covers[p.parent] === p.id;

const NAMED_COVER = /^\s*(cover|bia|ảnh bìa|anh bia)\b/i;

/**
 * Chọn ảnh bìa cho một album (hoặc nhóm album):
 * 1. Ảnh được thả ♥ cho chính album đó
 * 2. Ảnh được thả ♥ ở album con (theo thứ tự album)
 * 3. Ảnh có tên bắt đầu bằng "cover"/"bia" trên Drive
 * 4. Ảnh đầu tiên
 */
export function pickCover(albumId: string, photos: Photo[], covers: CoverMap): Photo | undefined {
  const own = covers[albumId];
  if (own) {
    const p = photos.find((x) => x.id === own);
    if (p) return p;
  }
  const hearted = photos.find((x) => covers[x.parent] === x.id);
  if (hearted) return hearted;
  return photos.find((x) => NAMED_COVER.test(x.name)) ?? photos[0];
}

/* ---------- Thông báo nhỏ ---------- */
const toastListeners = new Set<(msg: string) => void>();
export function toast(msg: string) {
  toastListeners.forEach((l) => l(msg));
}
export function onToast(l: (msg: string) => void) {
  toastListeners.add(l);
  return () => {
    toastListeners.delete(l);
  };
}
