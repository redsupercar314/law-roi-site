import { useMemo, useRef, useState } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, SCHOOL_XY, US_OUTLINE, US_STATES } from '../data/map.js';

const TONES = {
  'b-reach': 'reach',
  'b-target': 'target',
  'b-likely': 'likely',
  'b-verylikely': 'verylikely',
};

const LEGEND = [
  ['reach', 'Reach'],
  ['target', 'Target'],
  ['likely', 'Likely'],
  ['verylikely', 'Very likely'],
];

// Collapse schools that share a legal market into a compact seal cluster so
// Boston, New York, D.C., Chicago and Philadelphia stay readable at national
// scale. Each seal remains an individual, clickable school.
function layout(points) {
  const groups = new Map();
  for (const p of points) {
    const key = p.metro || p.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const out = [];
  for (const members of groups.values()) {
    members.sort((a, b) => a.name.localeCompare(b.name));
    const n = members.length;
    const cx = members.reduce((sum, p) => sum + p.x, 0) / n;
    const cy = members.reduce((sum, p) => sum + p.y, 0) / n;

    if (n === 1) {
      out.push({ ...members[0], px: members[0].x, py: members[0].y, cluster: 1, hitR: 9 });
      continue;
    }
    if (n === 2) {
      members.forEach((p, i) => out.push({ ...p, px: cx + (i ? 4.4 : -4.4), py: cy, cluster: n, hitR: 4.6 }));
      continue;
    }
    if (n === 3) {
      members.forEach((p, i) => {
        const a = ((-90 + i * 120) * Math.PI) / 180;
        out.push({ ...p, px: cx + Math.cos(a) * 6.4, py: cy + Math.sin(a) * 6.4, cluster: n, hitR: 4.8 });
      });
      continue;
    }
    if (n === 4) {
      members.forEach((p, i) => {
        const a = ((-90 + i * 90) * Math.PI) / 180;
        out.push({ ...p, px: cx + Math.cos(a) * 7.2, py: cy + Math.sin(a) * 7.2, cluster: n, hitR: 4.8 });
      });
      continue;
    }

    // Five or more: a tight, centered grid of seals.
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const sx = 7.8;
    const sy = 7.2;
    members.forEach((p, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, n - row * cols);
      out.push({
        ...p,
        px: cx + (col - (inRow - 1) / 2) * sx,
        py: cy + (row - (rows - 1) / 2) * sy,
        cluster: n,
        hitR: 4.05,
      });
    });
  }
  return out;
}

export default function MapPanel({ rows, matchedNames, searchActive, partTime, onSelect }) {
  const frameRef = useRef(null);
  const [tip, setTip] = useState(null);

  const points = useMemo(() => {
    return rows
      .map((r) => {
        const xy = SCHOOL_XY[r.s.name];
        const loc = r.s.location;
        if (!xy || !loc) return null;
        return {
          name: r.s.name,
          x: xy[0],
          y: xy[1],
          city: loc.city,
          state: loc.state,
          metro: loc.metro,
          rank: r.s.nonRanked ? 'NR' : `#${r.s.usnews_rank}`,
          chance: Math.round(r.c.chancePct),
          label: r.c.chanceLabel,
          tone: TONES[r.c.chanceClass] || 'reach',
          partTime: !!r.s.isPartTime,
        };
      })
      .filter(Boolean);
  }, [rows]);

  const markers = useMemo(() => layout(points), [points]);

  const matchCount = matchedNames ? markers.filter((p) => matchedNames.has(p.name)).length : markers.length;
  const states = useMemo(
    () => new Set(points.map((p) => p.state).filter((s) => s !== 'DC')),
    [points],
  );
  const hasDC = points.some((p) => p.state === 'DC');

  const showTip = (p, evt) => {
    const frame = frameRef.current;
    if (!frame) return;
    const fr = frame.getBoundingClientRect();
    let left;
    let top;
    if (evt && typeof evt.clientX === 'number' && (evt.clientX || evt.clientY)) {
      left = evt.clientX - fr.left;
      top = evt.clientY - fr.top;
    } else {
      const r = evt.currentTarget.getBoundingClientRect();
      left = r.left + r.width / 2 - fr.left;
      top = r.top - fr.top;
    }
    left = Math.max(104, Math.min(fr.width - 104, left));
    setTip({ ...p, left, top, below: top < 92 });
  };

  // Hovered seal paints last so it is never buried by a neighbor.
  const drawOrder = markers
    .slice()
    .sort((a, b) => {
      const ah = tip && tip.name === a.name ? 1 : 0;
      const bh = tip && tip.name === b.name ? 1 : 0;
      return ah - bh;
    });

  return (
    <div className="map-frame" ref={frameRef}>
      <div className="map-head">
        <div>
          <div className="map-kicker">The United States</div>
          <div className="map-sub">
            {searchActive
              ? `${matchCount} of ${markers.length} campuses match your search`
              : `${markers.length} campuses · ${states.size} states${hasDC ? ' + D.C.' : ''} · ${partTime ? 'part-time programs' : 'full-time programs'}`}
          </div>
        </div>
        <div className="map-legend" aria-label="Admission odds legend">
          {LEGEND.map(([tone, label]) => (
            <span key={tone}>
              <i className={`map-swatch s-${tone}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="map-viewport">
        <div className="map-stage">
          <svg
            className="map-svg"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="group"
            aria-label={`Map of ${markers.length} law schools across the United States. Each seal opens a school profile.`}
          >
            <defs>
              <filter id="mapLift" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor="#5c0f1a" floodOpacity="0.09" />
              </filter>
            </defs>

            <path className="map-land" d={US_OUTLINE} filter="url(#mapLift)" />
            <path className="map-state" d={US_STATES} />

            <g className="map-compass" transform="translate(928 534)" aria-hidden="true">
              <circle r="17" />
              <path d="M0 -21 L4.6 -4 L0 0 L-4.6 -4 Z" />
              <path d="M0 21 L3 -4 L0 0 L-3 -4 Z" className="compass-tail" />
              <path d="M-21 0 L-4 3 L0 0 L-4 -3 Z" className="compass-tail" />
              <path d="M21 0 L4 -3 L0 0 L4 3 Z" className="compass-tail" />
              <text y="-26">N</text>
            </g>

            <g className="map-markers">
              {drawOrder.map((p) => {
                const hovered = tip && tip.name === p.name;
                const dim = matchedNames && !matchedNames.has(p.name);
                return (
                  <g
                    key={p.name}
                    className={'map-marker' + (dim ? ' is-dim' : '')}
                    transform={`translate(${p.px.toFixed(1)} ${p.py.toFixed(1)})`}
                  >
                    {hovered && <circle className="map-halo" r="8.4" />}
                    <circle
                      className="map-hit"
                      r={p.hitR}
                      tabIndex={dim ? -1 : 0}
                      role="button"
                      aria-hidden={dim ? 'true' : undefined}
                      aria-label={`${p.name}, ${p.city}, ${p.state}. ${p.label}, ${p.chance}% modeled chance. Open profile.`}
                      onMouseEnter={(e) => showTip(p, e)}
                      onMouseLeave={() => setTip(null)}
                      onFocus={(e) => showTip(p, e)}
                      onBlur={() => setTip(null)}
                      onClick={() => {
                        setTip(null);
                        onSelect(p.name);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTip(null);
                          onSelect(p.name);
                        }
                      }}
                    />
                    <circle className={`map-dot c-${p.tone}`} r={hovered ? 5.2 : 3.25} />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      <div className="map-foot">
        <span className="map-note">
          Seal colour is the modeled admission odds for the profile above; positions are approximate campus points.
        </span>
        <span className="map-note">Click a seal — or tab to it and press Enter — to open its full profile.</span>
        <span className="map-scroll-hint">Swipe the map sideways to explore →</span>
      </div>

      {tip && (
        <div
          className={'map-tip' + (tip.below ? ' below' : '')}
          style={{ left: `${tip.left}px`, top: `${tip.top}px` }}
          role="status"
        >
          <div className="tip-name">{tip.name}</div>
          <div className="tip-sub">
            {tip.city}, {tip.state} · {tip.rank}
            {tip.partTime ? ' · Part-time' : ''}
          </div>
          <div className="tip-row">
            <i className={`map-swatch s-${tip.tone}`} />
            {tip.label} · {tip.chance}%
          </div>
          <div className="tip-cta">Open profile</div>
        </div>
      )}
    </div>
  );
}
