import { CSSProperties, useEffect, useState } from 'react';
import { displayName, FolderRef, getAllPhotos, getFolder, Photo } from '../lib/drive';
import { pickCover, useCovers } from '../lib/covers';
import { Img } from './Img';

interface Info {
  all: Photo[];
  photos: number;
  albums: number;
}

export function FolderCard({ folder, index, onOpen }: { folder: FolderRef; index: number; onOpen: () => void }) {
  const [info, setInfo] = useState<Info | null>(null);
  const covers = useCovers();

  useEffect(() => {
    let alive = true;
    Promise.all([getFolder(folder.id), getAllPhotos(folder.id)])
      .then(([c, all]) => alive && setInfo({ all, photos: all.length, albums: c.folders.length }))
      .catch(() => alive && setInfo({ all: [], photos: 0, albums: 0 }));
    return () => {
      alive = false;
    };
  }, [folder.id]);

  const cover = info ? pickCover(folder.id, info.all, covers) : undefined;
  const meta = info
    ? [info.albums ? `${info.albums} album` : '', info.photos ? `${info.photos} ảnh` : 'Sắp cập nhật']
        .filter(Boolean)
        .join(' · ')
    : ' ';

  return (
    <button className="fcard" onClick={onOpen} style={{ '--i': index } as CSSProperties}>
      <div className="fcard-frame">
        <div className={`fcard-media ${cover ? '' : 'is-empty'}`}>
          {cover ? (
            <Img key={cover.id} photo={cover} size={900} loading="lazy" />
          ) : (
            <div className={`fcard-placeholder ${info ? '' : 'shimmer'}`}>{info && <span>♡</span>}</div>
          )}
        </div>
      </div>
      <div className="fcard-title">{displayName(folder.name)}</div>
      <div className="fcard-meta">{meta}</div>
    </button>
  );
}
