// Head-to-head school comparison: 5 categories, 1 point each, most points wins.
// Numeric only — formatting lives in the UI.

export function outcomeScore(r) {
  const parts = [r.s.barPass, r.s.barReqEmployment].filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!parts.length) return null;
  return parts.reduce((x, y) => x + y, 0) / parts.length;
}

export const COMPARE_CATS = [
  { key: 'chance', name: 'Admission chance', get: (r) => r.c.chancePct, higher: true },
  { key: 'schol', name: 'Scholarship / yr', get: (r) => r.c.scholDollarY1, higher: true },
  { key: 'dti', name: 'Debt-to-income', get: (r) => r.c.dti, higher: false },
  { key: 'salary', name: 'Starting salary', get: (r) => r.c.salary, higher: true },
  { key: 'outcomes', name: 'Legal outcomes (bar + employment avg)', get: (r) => outcomeScore(r), higher: true },
];

export function compareRows(a, b) {
  const results = COMPARE_CATS.map((cat) => {
    const av = cat.get(a);
    const bv = cat.get(b);
    let winner = 'tie';
    if (av == null && bv == null) winner = 'tie';
    else if (av == null) winner = 'B';
    else if (bv == null) winner = 'A';
    else if (av !== bv) {
      winner = cat.higher ? (av > bv ? 'A' : 'B') : av < bv ? 'A' : 'B';
    }
    return { ...cat, av, bv, winner };
  });
  const ptsA = results.filter((r) => r.winner === 'A').length;
  const ptsB = results.filter((r) => r.winner === 'B').length;
  return { results, ptsA, ptsB };
}
