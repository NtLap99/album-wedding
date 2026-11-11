/** Cành lá trang trí kiểu thiệp cưới (vẽ bằng SVG, không cần file ảnh). */
export function Branch({ className }: { className?: string }) {
  const P0 = [12, 228], P1 = [50, 70], P2 = [228, 12];
  const at = (t: number) => {
    const u = 1 - t;
    return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]];
  };
  const leaves = [];
  for (let i = 1; i <= 11; i++) {
    const t = i / 12;
    const [x, y] = at(t);
    const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
    const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const size = 19 - t * 9;
    const side = i % 2 ? -55 : 55;
    leaves.push(
      <ellipse
        key={i}
        cx={0}
        cy={-size * 0.95}
        rx={size * 0.42}
        ry={size}
        opacity={0.55 + (i % 3) * 0.15}
        transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + side + 90).toFixed(1)})`}
      />,
    );
  }
  return (
    <svg className={className} viewBox="0 0 240 240" aria-hidden>
      <path d={`M${P0} Q${P1} ${P2}`} fill="none" stroke="currentColor" strokeWidth={1.4} opacity={0.7} />
      <g fill="currentColor">{leaves}</g>
      <g fill="var(--heart)" opacity={0.75}>
        <circle cx={70} cy={120} r={3.2} />
        <circle cx={78} cy={112} r={2.4} />
        <circle cx={150} cy={44} r={2.8} />
      </g>
    </svg>
  );
}
