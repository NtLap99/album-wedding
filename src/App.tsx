import { ReactNode, useEffect, useRef, useState } from 'react';
import { Branch } from './components/Branch';
import { FolderCard } from './components/FolderCard';
import { Gallery } from './components/Gallery';
import { IconPlay, IconRefresh, IconSparkle } from './components/Icons';
import { Img } from './components/Img';
import { Lightbox } from './components/Lightbox';
import { FallingDecor, HeartTrail } from './components/Decor';
import { Toast } from './components/HeartButton';
import { pickCover, useCovers } from './lib/covers';
import {
  clearCache,
  displayName,
  FolderContent,
  getAllPhotos,
  getFolder,
  IS_DEMO,
  parseCouple,
  Photo,
  ROOT_ID,
  SITE_SUBTITLE,
  WEDDING_DATE,
} from './lib/drive';
import { navigate, useTrail } from './lib/router';
import { EFFECTS, FALLINGS, INTERVALS, LAYOUTS, Settings, useSettings } from './lib/settings';

interface LightboxState {
  photos: Photo[];
  index: number;
  autoplay: boolean;
  title: string;
}

export default function App() {
  const trail = useTrail();
  const currentId = trail.length ? trail[trail.length - 1] : ROOT_ID;
  const isRoot = currentId === ROOT_ID;
  const [settings, update] = useSettings();
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: FolderContent }>({ loading: true });
  const [lb, setLb] = useState<LightboxState | null>(null);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState<number>();
  const scrolled = useScrolled(24);
  const rootName = useFolderName(ROOT_ID);
  const couple = parseCouple(rootName);

  useEffect(() => {
    // Link cũ của chế độ demo (hoặc ngược lại) → quay về trang chủ
    if (trail.some((id) => id.startsWith('demo') !== IS_DEMO)) {
      navigate([]);
      return;
    }
    let alive = true;
    setState((s) => ({ loading: true, data: s.data?.id === currentId ? s.data : undefined }));
    setTotal(undefined);
    getFolder(currentId)
      .then((data) => {
        if (!alive) return;
        setState({ loading: false, data });
        getAllPhotos(currentId).then((all) => alive && setTotal(all.length)).catch(() => {});
      })
      .catch((e: Error) => {
        if (!alive) return;
        if (currentId !== ROOT_ID && /not found|không tìm thấy/i.test(e.message)) navigate([]);
        else setState({ loading: false, error: e.message });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, reload]);

  // Tự làm mới khi quay lại tab (để thấy ảnh mới upload)
  useEffect(() => {
    const on = () => document.visibilityState === 'visible' && setReload((x) => x + 1);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const data = state.data;
  const title = data ? displayName(data.name) : '';

  // Tiêu đề tab: chỉ tên cô dâu & chú rể (vd "Thanh Lập & Nguyễn Sa")
  useEffect(() => {
    if (!rootName) return;
    document.title = couple.names.length === 2 ? couple.names.join(' & ') : rootName;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootName]);

  const playAll = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const photos = await getAllPhotos(data.id);
      if (photos.length) setLb({ photos, index: 0, autoplay: true, title });
    } finally {
      setBusy(false);
    }
  };
  const playHere = () => data && setLb({ photos: data.photos, index: 0, autoplay: true, title });

  const refresh = () => {
    clearCache();
    setReload((x) => x + 1);
  };

  const parentId = trail.length >= 2 ? trail[trail.length - 2] : ROOT_ID;
  const meta = [data?.folders.length ? `${data.folders.length} album` : '', total ? `${total} ảnh` : '']
    .filter(Boolean)
    .join('  ·  ');

  const playButtons = data && (
    <>
      {data.photos.length > 0 && (
        <button className="btn primary" onClick={playHere}>
          <IconPlay /> Trình chiếu
        </button>
      )}
      {data.folders.length > 0 && (total ?? 0) > 0 && (
        <button className={`btn ${data.photos.length || isRoot ? 'outline' : 'primary'}`} onClick={playAll} disabled={busy}>
          {busy ? <span className="spinner sm" /> : <IconPlay />} {isRoot ? 'Xem trình chiếu' : 'Trình chiếu tất cả'}
        </button>
      )}
    </>
  );

  return (
    <>
      <FallingDecor kind={settings.falling} />
      {settings.trail && <HeartTrail />}

      <header className={`topbar ${scrolled ? 'solid' : ''}`}>
        <a className="brand" href="#/">
          {couple.names.length === 2 ? (
            <>
              {couple.names[0]} <span className="amp">&</span> {couple.names[1]}
            </>
          ) : (
            rootName || 'Album'
          )}
        </a>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={refresh} title="Tải lại từ Google Drive">
            <IconRefresh />
          </button>
          <SettingsMenu settings={settings} update={update} />
        </div>
      </header>

      {isRoot ? (
        <Invitation
          couple={couple}
          fallback={rootName}
          meta={meta}
          actions={playButtons}
          onView={() => document.getElementById('albums')?.scrollIntoView({ behavior: 'smooth' })}
        />
      ) : (
        <section className="page-hero">
          <Branch className="branch b-left" />
          <Branch className="branch b-right" />
          <Breadcrumbs trail={trail} />
          <div className="script-kicker">Album</div>
          <h1 className="page-title">{title || ' '}</h1>
          <Divider />
          {meta && <div className="page-meta">{meta}</div>}
          {data && (data.photos.length > 0 || data.folders.length > 0) && <div className="page-actions">{playButtons}</div>}
        </section>
      )}

      {!isRoot && <AlbumTabs parentId={parentId} prefix={trail.slice(0, -1)} currentId={currentId} />}

      <main className="content" id="albums">
        {IS_DEMO && (
          <div className="notice">
            Đang chạy <b>chế độ demo</b> với ảnh mẫu — điền <code>.env</code> để hiển thị ảnh từ Google Drive.
          </div>
        )}
        {state.error && <ErrorBox message={state.error} onRetry={refresh} />}
        {state.loading && !data && (
          <div className="loading">
            <span className="spinner" /> Đang tải album…
          </div>
        )}

        {data && (
          <>
            {data.folders.length > 0 && (
              <section className="block">
                <SectionHead kicker={isRoot ? 'Our memories' : 'Albums'} title={isRoot ? 'Album ảnh cưới' : 'Các album'} />
                <div className="folders">
                  {data.folders.map((f, i) => (
                    <FolderCard key={f.id} folder={f} index={i} onOpen={() => navigate([...trail, f.id])} />
                  ))}
                </div>
              </section>
            )}

            {data.photos.length > 0 && (
              <section className="block">
                {data.folders.length > 0 && <SectionHead kicker="Photos" title="Ảnh" />}
                <Gallery
                  photos={data.photos}
                  layout={settings.layout}
                  onOpen={(index) => setLb({ photos: data.photos, index, autoplay: false, title })}
                />
              </section>
            )}

            {!data.folders.length && !data.photos.length && (
              <div className="empty">
                <Branch className="empty-branch" />
                <div className="empty-title">Album đang được cập nhật</div>
                <small>Ảnh sẽ xuất hiện ngay khi được tải lên Google Drive.</small>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <Branch className="branch f-left" />
        <Branch className="branch f-right" />
        <div className="footer-script">Thank you</div>
        <div className="footer-names">{rootName}</div>
        <Divider />
        <div className="footer-thanks">Cảm ơn bạn đã cùng chúng mình lưu giữ những khoảnh khắc này</div>
      </footer>

      <Toast />

      {lb && (
        <Lightbox
          photos={lb.photos}
          startIndex={lb.index}
          autoplay={lb.autoplay}
          effect={settings.effect}
          interval={settings.interval}
          title={lb.title}
          onClose={() => setLb(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Invitation({
  couple,
  fallback,
  meta,
  actions,
  onView,
}: {
  couple: { prefix: string; names: string[] };
  fallback: string;
  meta: string;
  actions: ReactNode;
  onView: () => void;
}) {
  const [all, setAll] = useState<Photo[]>([]);
  const covers = useCovers();
  useEffect(() => {
    getAllPhotos(ROOT_ID)
      .then(setAll)
      .catch(() => setAll([]));
  }, []);
  const cover = pickCover(ROOT_ID, all, covers);

  return (
    <section className="invite">
      <Branch className="branch i-tl" />
      <Branch className="branch i-br" />
      <div className="invite-inner">
        <div className="invite-photo">
          <div className="arch">
            {cover && <Img key={cover.id} photo={cover} size={1600} alt="" />}
          </div>
          <div className="arch-ring" />
        </div>
        <div className="invite-text">
          <div className="kicker">{couple.prefix || 'Save the date'}</div>
          {couple.names.length === 2 ? (
            <h1 className="names">
              <span>{couple.names[0]}</span>
              <span className="amp">&</span>
              <span>{couple.names[1]}</span>
            </h1>
          ) : (
            <h1 className="names single">{fallback || ' '}</h1>
          )}
          {WEDDING_DATE ? (
            <div className="date">
              <span />
              {WEDDING_DATE}
              <span />
            </div>
          ) : (
            <Divider />
          )}
          <p className="invite-sub">{SITE_SUBTITLE}</p>
          {meta && <div className="invite-meta">{meta}</div>}
          <div className="invite-actions">
            <button className="btn primary" onClick={onView}>
              Xem album
            </button>
            {actions}
          </div>
        </div>
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="divider" aria-hidden>
      <span />
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path d="M12 21s-7.5-4.6-7.5-10.4A4.3 4.3 0 0112 8a4.3 4.3 0 017.5 2.6C19.5 16.4 12 21 12 21z" fill="currentColor" />
      </svg>
      <span />
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="section-head">
      <div className="script-kicker">{kicker}</div>
      <h2>{title}</h2>
      <Divider />
    </div>
  );
}

function useScrolled(offset: number) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const on = () => setV(window.scrollY > offset);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [offset]);
  return v;
}

function useFolderName(id: string) {
  const [name, setName] = useState('');
  useEffect(() => {
    let alive = true;
    getFolder(id)
      .then((c) => alive && setName(displayName(c.name)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return name;
}

function AlbumTabs({ parentId, prefix, currentId }: { parentId: string; prefix: string[]; currentId: string }) {
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    getFolder(parentId)
      .then((c) => setItems(c.folders))
      .catch(() => {});
  }, [parentId]);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.active');
    if (el && ref.current) ref.current.scrollLeft = el.offsetLeft - ref.current.clientWidth / 2 + el.clientWidth / 2;
  }, [items, currentId]);
  if (items.length < 2) return null;
  return (
    <nav className="tabs" ref={ref}>
      <div className="tabs-inner">
        {items.map((f) => (
          <a
            key={f.id}
            className={f.id === currentId ? 'active' : ''}
            href={'#/' + [...prefix, f.id].map(encodeURIComponent).join('/')}
          >
            {displayName(f.name)}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Crumb({ id }: { id: string }) {
  return <>{useFolderName(id) || '…'}</>;
}

function Breadcrumbs({ trail }: { trail: string[] }) {
  return (
    <nav className="crumbs">
      <a href="#/">Trang chủ</a>
      {trail.slice(0, -1).map((id, i) => (
        <span key={id}>
          <span className="sep">›</span>
          <a href={'#/' + trail.slice(0, i + 1).map(encodeURIComponent).join('/')}>
            <Crumb id={id} />
          </a>
        </span>
      ))}
    </nav>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error">
      <b>Không tải được ảnh từ Google Drive.</b>
      <div className="error-msg">{message}</div>
      <ul>
        <li>Kiểm tra thư mục đã được chia sẻ <i>“Bất kỳ ai có đường liên kết – Người xem”</i>.</li>
        <li>Kiểm tra API key đã bật <i>Google Drive API</i> và cho phép tên miền hiện tại.</li>
        <li>Kiểm tra ID thư mục gốc trong file <code>.env</code>.</li>
      </ul>
      <button className="btn outline" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

function SettingsMenu({ settings, update }: { settings: Settings; update: (p: Partial<Settings>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, [open]);

  return (
    <div className="settings" ref={ref}>
      <button className={`icon-btn ${open ? 'on' : ''}`} onClick={() => setOpen((x) => !x)} title="Hiệu ứng & bố cục">
        <IconSparkle />
      </button>
      {open && <div className="settings-backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="settings-panel">
          <div className="settings-head">
            <span>Tuỳ chỉnh hiển thị</span>
            <button className="settings-close" onClick={() => setOpen(false)} aria-label="Đóng">
              ✕
            </button>
          </div>
          <Group label="Bố cục ảnh">
            {LAYOUTS.map((l) => (
              <Chip key={l.value} on={settings.layout === l.value} onClick={() => update({ layout: l.value })}>
                {l.label}
              </Chip>
            ))}
          </Group>
          <Group label="Hiệu ứng chuyển ảnh">
            {EFFECTS.map((e) => (
              <Chip key={e.value} on={settings.effect === e.value} onClick={() => update({ effect: e.value })}>
                {e.label}
              </Chip>
            ))}
          </Group>
          <Group label="Thời gian mỗi ảnh khi trình chiếu">
            {INTERVALS.map((s) => (
              <Chip key={s} on={settings.interval === s} onClick={() => update({ interval: s })}>
                {s} giây
              </Chip>
            ))}
          </Group>
          <Group label="Trang trí nền">
            {FALLINGS.map((f) => (
              <Chip key={f.value} on={settings.falling === f.value} onClick={() => update({ falling: f.value })}>
                {f.label}
              </Chip>
            ))}
          </Group>
          <Group label="Hiệu ứng chuột">
            <Chip on={settings.trail} onClick={() => update({ trail: !settings.trail })}>
              ♥ Tim bay theo chuột & khi bấm
            </Chip>
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sgroup">
      <div className="sgroup-label">{label}</div>
      <div className="chips">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`chip ${on ? 'on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
