const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconPlay = () => (<svg {...base}><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" /></svg>);
export const IconPause = () => (<svg {...base}><path d="M8 5v14M16 5v14" strokeWidth={3} /></svg>);
export const IconClose = () => (<svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconLeft = () => (<svg {...base} width={28} height={28}><path d="M15 5l-7 7 7 7" /></svg>);
export const IconRight = () => (<svg {...base} width={28} height={28}><path d="M9 5l7 7-7 7" /></svg>);
export const IconExpand = () => (<svg {...base}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
export const IconDownload = () => (<svg {...base}><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>);
export const IconExternal = () => (<svg {...base}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>);
export const IconGrid = () => (<svg {...base}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>);
export const IconSparkle = () => (<svg {...base}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>);
export const IconRefresh = () => (<svg {...base}><path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" /></svg>);
export const IconHeart = () => (<svg {...base}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>);
