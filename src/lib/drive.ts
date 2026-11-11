/**
 * Lớp đọc dữ liệu từ Google Drive.
 *
 * Quy ước: cấu trúc thư mục trên Drive = cấu trúc album trên web.
 *   Thư mục gốc
 *   ├── 01. Lễ ăn hỏi 21/10        ← nhóm
 *   │   ├── Cô dâu                 ← album (chứa ảnh)
 *   │   ├── Chú rể
 *   │   └── Họ hàng
 *   └── 02. Lễ cưới 25/10
 *       └── ...
 * Thư mục nào cũng có thể vừa chứa ảnh vừa chứa thư mục con, lồng bao nhiêu cấp cũng được.
 * Tiền tố số "01. " chỉ dùng để sắp xếp, sẽ được ẩn khi hiển thị.
 */

export interface FolderRef {
  id: string;
  name: string;
}

export interface Photo {
  id: string;
  name: string;
  width: number;
  height: number;
  created?: string;
  /** Danh sách URL thử lần lượt (URL sau là dự phòng khi URL trước lỗi). */
  sources: (size: number) => string[];
  viewUrl: string;
  downloadUrl: string;
  /** ID thư mục (album) chứa ảnh */
  parent: string;
}

export interface FolderContent {
  id: string;
  name: string;
  folders: FolderRef[];
  photos: Photo[];
}

const env = import.meta.env;
const API_KEY = (env.VITE_GOOGLE_API_KEY ?? '').trim();
const ROOT = (env.VITE_DRIVE_ROOT_FOLDER_ID ?? '').trim();

export const IS_DEMO = !API_KEY || !ROOT;
export const ROOT_ID = IS_DEMO ? 'demo' : ROOT;
export const SITE_SUBTITLE = (env.VITE_SITE_SUBTITLE ?? '').trim() || 'Lưu giữ những khoảnh khắc hạnh phúc';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
/** Sau 5 phút dữ liệu được tải lại, nên ảnh mới upload lên Drive sẽ tự xuất hiện. */
const TTL = 5 * 60_000;

const cache = new Map<string, { t: number; p: Promise<unknown> }>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.p as Promise<T>;
  const p = fn();
  cache.set(key, { t: Date.now(), p });
  p.catch(() => cache.delete(key));
  return p;
}

export function clearCache() {
  cache.clear();
}

export function displayName(name: string) {
  return name.replace(/^\s*\d+\s*[.\-_)]\s*/, '').trim() || name;
}

const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
const byName = (a: { name: string }, b: { name: string }) => collator.compare(a.name, b.name);

/* ------------------------------------------------------------------ */
/* Google Drive API v3                                                 */
/* ------------------------------------------------------------------ */

interface RawFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  createdTime?: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number; time?: string };
}

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  const all = { ...params, key: API_KEY, supportsAllDrives: 'true' };
  for (const [k, v] of Object.entries(all)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function listChildren(id: string): Promise<RawFile[]> {
  const out: RawFile[] = [];
  let pageToken: string | undefined;
  do {
    const r = await api<{ files: RawFile[]; nextPageToken?: string }>('files', {
      q: `'${id}' in parents and trashed = false and (mimeType = '${FOLDER_MIME}' or mimeType contains 'image/')`,
      fields:
        'nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime,imageMediaMetadata(width,height,rotation,time))',
      pageSize: '1000',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    });
    out.push(...(r.files ?? []));
    pageToken = r.nextPageToken;
  } while (pageToken);
  return out;
}

function toPhoto(f: RawFile, parent: string): Photo {
  const m = f.imageMediaMetadata ?? {};
  let w = m.width || 4;
  let h = m.height || 3;
  if ((m.rotation ?? 0) % 2 === 1) [w, h] = [h, w];
  return {
    id: f.id,
    name: f.name,
    width: w,
    height: h,
    created: m.time || f.createdTime,
    sources: (size) => {
      const list = [`https://lh3.googleusercontent.com/d/${f.id}=s${size}`];
      if (f.thumbnailLink) list.push(f.thumbnailLink.replace(/=s\d+$/, `=s${size}`));
      list.push(`https://drive.google.com/thumbnail?id=${f.id}&sz=w${size}`);
      return list;
    },
    parent,
    viewUrl: `https://drive.google.com/file/d/${f.id}/view`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
  };
}

async function driveFolder(id: string): Promise<FolderContent> {
  const [meta, files] = await Promise.all([
    api<{ id: string; name: string }>(`files/${id}`, { fields: 'id,name' }),
    listChildren(id),
  ]);
  return {
    id,
    name: meta.name,
    folders: files
      .filter((f) => f.mimeType === FOLDER_MIME)
      .map((f) => ({ id: f.id, name: f.name }))
      .sort(byName),
    photos: files
      .filter((f) => f.mimeType.startsWith('image/'))
      .sort(byName)
      .map((f) => toPhoto(f, id)),
  };
}

/* ------------------------------------------------------------------ */
/* API công khai                                                       */
/* ------------------------------------------------------------------ */

export function getFolder(id: string): Promise<FolderContent> {
  return cached('f:' + id, () => (IS_DEMO ? demoFolder(id) : driveFolder(id)));
}

/** Toàn bộ ảnh trong thư mục và mọi thư mục con (theo thứ tự). */
export function getAllPhotos(id: string): Promise<Photo[]> {
  return cached('all:' + id, async () => {
    const c = await getFolder(id);
    const nested = await Promise.all(c.folders.map((f) => getAllPhotos(f.id)));
    return [...c.photos, ...nested.flat()];
  });
}

/** Ảnh bìa: ảnh đầu tiên tìm được trong thư mục (hoặc thư mục con). */
export async function getCover(id: string, depth = 3): Promise<Photo | undefined> {
  const c = await getFolder(id);
  if (c.photos.length) return c.photos[0];
  if (depth <= 0) return undefined;
  for (const f of c.folders) {
    const p = await getCover(f.id, depth - 1);
    if (p) return p;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Dữ liệu demo (dùng khi chưa cấu hình .env)                          */
/* ------------------------------------------------------------------ */

interface DemoNode {
  name: string;
  n?: number;
  children?: DemoNode[];
}

const DEMO_TREE: DemoNode = {
  name: 'Album Cưới',
  children: [
    {
      name: '01. Lễ ăn hỏi 21/10',
      children: [
        { name: '01. Cô dâu', n: 9 },
        { name: '02. Chú rể', n: 7 },
        { name: '03. Họ hàng', n: 12 },
        { name: '04. Bạn bè', n: 10 },
      ],
    },
    {
      name: '02. Lễ cưới 25/10',
      children: [
        { name: '01. Cô dâu', n: 11 },
        { name: '02. Chú rể', n: 8 },
        { name: '03. Họ hàng nhà trai', n: 9 },
        { name: '04. Họ hàng nhà gái', n: 9 },
        { name: '05. Bạn bè', n: 14 },
      ],
    },
    { name: '03. Ảnh cưới studio', n: 16 },
  ],
};

const DEMO_SIZES: [number, number][] = [
  [1500, 1000],
  [1000, 1500],
  [1200, 1200],
  [1600, 1200],
  [1000, 1400],
];

async function demoFolder(id: string): Promise<FolderContent> {
  await new Promise((r) => setTimeout(r, 200));
  const path = id === 'demo' ? [] : id.replace(/^demo\./, '').split('.').map(Number);
  let node: DemoNode | undefined = DEMO_TREE;
  for (const i of path) node = node?.children?.[i];
  if (!node) throw new Error('Không tìm thấy thư mục');
  const photos: Photo[] = Array.from({ length: node.n ?? 0 }, (_, i) => {
    const seed = `${id}-${i}`;
    const [w, h] = DEMO_SIZES[(i * 7 + path.length * 3 + (path[0] ?? 0)) % DEMO_SIZES.length];
    const url = (size: number) => {
      const k = size / Math.max(w, h);
      return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${Math.round(w * k)}/${Math.round(h * k)}`;
    };
    return {
      id: seed,
      name: `IMG_${String(1000 + i)}.jpg`,
      width: w,
      height: h,
      sources: (size) => [url(size)],
      parent: id,
      viewUrl: url(2000),
      downloadUrl: url(2000),
    };
  });
  return {
    id,
    name: node.name,
    folders: (node.children ?? []).map((c, i) => ({ id: `${id}.${i}`, name: c.name })),
    photos,
  };
}

export const WEDDING_DATE = (env.VITE_WEDDING_DATE ?? '').trim();

/** "Đám cưới Thanh Lập & Nguyễn Sa" → { prefix: "Đám cưới", names: ["Thanh Lập", "Nguyễn Sa"] } */
export function parseCouple(title: string): { prefix: string; names: string[] } {
  const m = title.match(/^\s*((?:đám|lễ|tiệc)\s+(?:cưới|hỏi|thành hôn)|wedding(?:\s+of)?|the wedding of)\s+(.+)$/i);
  const prefix = m ? m[1] : '';
  const rest = m ? m[2] : title;
  const names = rest.split(/\s*(?:&|\+| và | and )\s*/i).filter(Boolean);
  return { prefix, names: names.length === 2 ? names : [rest] };
}
